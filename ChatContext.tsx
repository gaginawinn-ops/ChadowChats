import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface Chat {
  id: string;
  contactUid: string;
  contactName: string;
  contactUserId: string;
  contactStatus: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export interface Group {
  id: string;
  name: string;
  type: "public" | "private";
  description: string;
  groupId: string;
  members: string[];
  createdBy: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type: "text" | "image" | "audio" | "video" | "reply";
  mediaUrl?: string;
  timestamp: number;
  isAnonymous?: boolean;
  replyTo?: { id: string; text: string; senderName: string } | null;
}

interface ChatContextType {
  chats: Chat[];
  groups: Group[];
  publicGroups: Group[];
  loadMessages: (chatId: string, isGroup: boolean) => () => void;
  sendMessage: (chatId: string, msg: Omit<Message, "id">) => Promise<void>;
  sendGroupMessage: (groupId: string, msg: Omit<Message, "id">) => Promise<void>;
  markChatRead: (chatId: string) => Promise<void>;
  markGroupRead: (groupId: string) => Promise<void>;
  startChat: (otherUid: string) => Promise<string>;
  createGroup: (name: string, type: "public" | "private", description: string) => Promise<string>;
  joinGroup: (groupDocId: string) => Promise<void>;
  joinGroupById: (alphaId: string) => Promise<string | null>;
  leaveGroup: (groupDocId: string) => Promise<void>;
  searchUserById: (userId: string) => Promise<{ uid: string; username: string; userId: string } | null>;
  uploadMedia: (uri: string, path: string) => Promise<string>;
  myGroups: Group[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function generateGroupId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

const DEFAULT_CHANNELS = [
  {
    id: "public-chat",
    name: "Public Chat",
    type: "public" as const,
    description: "Open channel for all operatives",
    groupId: "PUBCHAT",
  },
  {
    id: "cipher-cell",
    name: "Cipher Cell",
    type: "private" as const,
    description: "Encrypted dark net cell",
    groupId: "CIPCEL",
  },
  {
    id: "ghost-ops",
    name: "Ghost Ops",
    type: "private" as const,
    description: "Stealth operations network",
    groupId: "GHSOPS",
  },
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const subsRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const subs = subsRef.current;
    return () => subs.forEach((u) => u());
  }, []);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setGroups([]);
      setPublicGroups([]);
      subsRef.current.forEach((u) => u());
      subsRef.current = [];
      return;
    }

    subsRef.current.forEach((u) => u());
    subsRef.current = [];

    seedDefaultChannels();

    const chatUnsub = onSnapshot(
      query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid)
      ),
      async (snap) => {
        const chatList: Chat[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          const otherUid = data.participants.find((p: string) => p !== user.uid);
          if (!otherUid) continue;
          const contactSnap = await getDoc(doc(db, "users", otherUid));
          const contact = contactSnap.exists() ? contactSnap.data() : null;
          chatList.push({
            id: d.id,
            contactUid: otherUid,
            contactName: contact?.username ?? "Unknown",
            contactUserId: contact?.userId ?? "",
            contactStatus: contact?.status ?? "offline",
            lastMessage: data.lastMessage ?? "",
            lastMessageTime: data.lastMessageTime ?? 0,
            unreadCount: data.unreadCounts?.[user.uid] ?? 0,
          });
        }
        chatList.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        setChats(chatList);
      }
    );

    const groupUnsub = onSnapshot(
      query(
        collection(db, "groups"),
        where("members", "array-contains", user.uid),
        where("type", "==", "private")
      ),
      (snap) => {
        const list: Group[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            type: data.type,
            description: data.description ?? "",
            groupId: data.groupId ?? "",
            members: data.members ?? [],
            createdBy: data.createdBy ?? "",
            lastMessage: data.lastMessage ?? "",
            lastMessageTime: data.lastMessageTime ?? 0,
            unreadCount: data.unreadCounts?.[user.uid] ?? 0,
          };
        });
        list.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        setGroups(list);
      }
    );

    const publicUnsub = onSnapshot(
      query(collection(db, "groups"), where("type", "==", "public")),
      (snap) => {
        const list: Group[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            type: data.type,
            description: data.description ?? "",
            groupId: data.groupId ?? "",
            members: data.members ?? [],
            createdBy: data.createdBy ?? "",
            lastMessage: data.lastMessage ?? "",
            lastMessageTime: data.lastMessageTime ?? 0,
            unreadCount: data.unreadCounts?.[user.uid] ?? 0,
          };
        });
        list.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        setPublicGroups(list);
      }
    );

    subsRef.current = [chatUnsub, groupUnsub, publicUnsub];
  }, [user?.uid]);

  async function seedDefaultChannels() {
    for (const ch of DEFAULT_CHANNELS) {
      const ref = doc(db, "groups", ch.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name: ch.name,
          type: ch.type,
          description: ch.description,
          groupId: ch.groupId,
          members: [],
          createdBy: "system",
          createdAt: Date.now(),
          lastMessage: "",
          lastMessageTime: 0,
          unreadCounts: {},
        });
      }
    }
  }

  const loadMessages = useCallback(
    (chatId: string, isGroup: boolean) => {
      const col = isGroup
        ? collection(db, "groups", chatId, "messages")
        : collection(db, "chats", chatId, "messages");
      const q = query(col, orderBy("timestamp", "asc"));
      return onSnapshot(q, () => {});
    },
    []
  );

  const sendMessage = useCallback(
    async (chatId: string, msg: Omit<Message, "id">) => {
      await addDoc(collection(db, "chats", chatId, "messages"), msg);
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const data = chatSnap.data();
        const otherUid = data.participants.find((p: string) => p !== user?.uid);
        const updates: Record<string, unknown> = {
          lastMessage:
            msg.type === "text"
              ? msg.text
              : msg.type === "image"
              ? "📷 Photo"
              : msg.type === "audio"
              ? "🎤 Voice"
              : "🎬 Video",
          lastMessageTime: msg.timestamp,
        };
        if (otherUid) {
          updates[`unreadCounts.${otherUid}`] =
            (data.unreadCounts?.[otherUid] ?? 0) + 1;
        }
        await updateDoc(chatRef, updates);
      }
    },
    [user?.uid]
  );

  const sendGroupMessage = useCallback(
    async (groupId: string, msg: Omit<Message, "id">) => {
      await addDoc(collection(db, "groups", groupId, "messages"), msg);
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const data = groupSnap.data();
        const updates: Record<string, unknown> = {
          lastMessage:
            msg.type === "text"
              ? msg.text
              : msg.type === "image"
              ? "📷 Photo"
              : msg.type === "audio"
              ? "🎤 Voice"
              : "🎬 Video",
          lastMessageTime: msg.timestamp,
        };
        for (const memberId of data.members ?? []) {
          if (memberId !== user?.uid) {
            updates[`unreadCounts.${memberId}`] =
              (data.unreadCounts?.[memberId] ?? 0) + 1;
          }
        }
        await updateDoc(groupRef, updates);
      }
    },
    [user?.uid]
  );

  const markChatRead = useCallback(
    async (chatId: string) => {
      if (!user) return;
      await updateDoc(doc(db, "chats", chatId), {
        [`unreadCounts.${user.uid}`]: 0,
      }).catch(() => {});
    },
    [user]
  );

  const markGroupRead = useCallback(
    async (groupId: string) => {
      if (!user) return;
      await updateDoc(doc(db, "groups", groupId), {
        [`unreadCounts.${user.uid}`]: 0,
      }).catch(() => {});
    },
    [user]
  );

  const startChat = useCallback(
    async (otherUid: string): Promise<string> => {
      if (!user) throw new Error("Not authenticated");
      const ids = [user.uid, otherUid].sort();
      const chatId = ids.join("_");
      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        await setDoc(chatRef, {
          participants: ids,
          lastMessage: "",
          lastMessageTime: Date.now(),
          unreadCounts: {},
          createdAt: Date.now(),
        });
      }
      return chatId;
    },
    [user]
  );

  const createGroup = useCallback(
    async (name: string, type: "public" | "private", description: string): Promise<string> => {
      if (!user) throw new Error("Not authenticated");
      const groupId = generateGroupId();
      const docRef = await addDoc(collection(db, "groups"), {
        name,
        type,
        description,
        groupId,
        members: [user.uid],
        createdBy: user.uid,
        createdAt: Date.now(),
        lastMessage: "",
        lastMessageTime: 0,
        unreadCounts: {},
      });
      return docRef.id;
    },
    [user]
  );

  const joinGroup = useCallback(
    async (groupDocId: string) => {
      if (!user) return;
      await updateDoc(doc(db, "groups", groupDocId), {
        members: arrayUnion(user.uid),
      });
    },
    [user]
  );

  const joinGroupById = useCallback(
    async (alphaId: string): Promise<string | null> => {
      const snap = await getDocs(
        query(collection(db, "groups"), where("groupId", "==", alphaId.toUpperCase()))
      );
      if (snap.empty) return null;
      const groupDocId = snap.docs[0].id;
      await joinGroup(groupDocId);
      return groupDocId;
    },
    [joinGroup]
  );

  const leaveGroup = useCallback(
    async (groupDocId: string) => {
      if (!user) return;
      await updateDoc(doc(db, "groups", groupDocId), {
        members: arrayRemove(user.uid),
      });
    },
    [user]
  );

  const searchUserById = useCallback(
    async (userId: string) => {
      const snap = await getDocs(
        query(collection(db, "users"), where("userId", "==", userId.toUpperCase()))
      );
      if (snap.empty) return null;
      const data = snap.docs[0].data();
      return { uid: data.uid, username: data.username, userId: data.userId };
    },
    []
  );

  const uploadMedia = useCallback(async (uri: string, path: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ref = storageRef(storage, path);
    const snapshot = await uploadBytes(ref, blob);
    return await getDownloadURL(snapshot.ref);
  }, []);

  const myGroups = [...groups, ...publicGroups].filter(
    (g) => g.createdBy === user?.uid
  );

  return (
    <ChatContext.Provider
      value={{
        chats,
        groups,
        publicGroups,
        loadMessages,
        sendMessage,
        sendGroupMessage,
        markChatRead,
        markGroupRead,
        startChat,
        createGroup,
        joinGroup,
        joinGroupById,
        leaveGroup,
        searchUserById,
        uploadMedia,
        myGroups,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
