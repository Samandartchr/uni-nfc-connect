import { auth } from "./firebase";

export async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user signed in");
    return null;
  }
  return user.getIdToken();
}

//const apiUrl = import.meta.env.VITE_API_URL ?? "https://my-web-api-1082434380661.us-central1.run.app/api";
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5165/api";
const postPageSize = 10;

const endpoints = {
  getPosts: ["feed", "getposts"],
  getMyPosts: ["feed", "getmyposts"],
  getLikedPosts: ["feed", "getlikedposts"],
  addPost: ["feed", "addpost"],
  getComments: ["feed", "getcomments"],
  addComment: ["feed", "addcomment"],
  likePost: ["feed", "likepost"],
  getPublicProfile: ["user", "getpublicprofile"],
  visitProfile: ["user", "visitprofile"],
  addFriend: ["user", "addfriend"],
} as const;

export async function apiRequest(first: string, second: string, method: string, body?: unknown) {
  const token = await getToken();

  return fetch(`${apiUrl}/${first}/${second}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (text ? JSON.parse(text) : null) as T;
}

export interface UserRegister {
  Email: string;
  Name: string;
}

export interface UserPublic extends UserRegister {
  ProfileImageLink?: string | null;
  ID: string;
  Specialization?: string | null;
  Grade: number;
}

export interface UserProfile extends UserPublic {
  Bio?: string | null;
  Goals?: string[] | null;
  Interests?: string[] | null;
  VisitersIDs?: string[] | null;
  Requests?: string[] | null;
  Friends?: string[] | null;
  Chats?: string[] | null;
  Posts?: string[] | null;
}

export interface Post {
  Author: UserPublic;
  PostID: string;
  Timestamp: string;
  ReplyToPostID?: string | null;
  LikesNum?: number | null;
  CommentsNum?: number | null;
  Text: string;
}

export interface Comment {
  CommentID: string;
  PostID: string;
  Commenter: UserPublic;
  Text: string;
}

export interface AddPostPayload {
  Author: UserPublic;
  ReplyToPostID?: string | null;
  Text: string;
}

export interface AddCommentPayload {
  PostID: string;
  Commenter: UserPublic;
  Text: string;
}

export interface AddLikePayload {
  PostID: string;
  Liker: UserPublic;
}

export interface PostsCursor {
  PostID: string;
  Timestamp: string;
}

export interface PostsPage {
  Posts: Post[];
  NextCursor: PostsCursor | null;
  HasMore: boolean;
}

export async function callApiRequest(payload: UserRegister) {
  return apiRequest("auth", "register", "POST", payload);
}

export async function getProfile() {
  const response = await apiRequest("user", "getprofile", "GET");
  return readApiResponse<UserProfile>(response);
}

export async function updateProfile(payload: UserProfile) {
  const response = await apiRequest("user", "updateprofile", "POST", payload);
  return readApiResponse<UserProfile | null>(response);
}

export async function getPublicProfile(userID: string) {
  const search = new URLSearchParams({ userID });
  const [first, second] = endpoints.getPublicProfile;
  const response = await apiRequest(first, `${second}?${search}`, "GET");
  return readApiResponse<UserProfile>(response);
}

export async function visitProfile(userID: string) {
  const search = new URLSearchParams({ userID });
  const [first, second] = endpoints.visitProfile;
  const response = await apiRequest(first, `${second}?${search}`, "POST");
  return readApiResponse<unknown>(response);
}

export async function addFriend(userID: string) {
  const [first, second] = endpoints.addFriend;
  const response = await apiRequest(first, second, "POST", userID);
  return readApiResponse<unknown>(response);
}

export async function getPosts(cursor?: PostsCursor | null): Promise<PostsPage> {
  const search = new URLSearchParams({ limit: String(postPageSize) });

  if (cursor) {
    search.set("lastPostID", cursor.PostID);
    search.set("lastTimestamp", cursor.Timestamp);
  }

  const [first, second] = endpoints.getPosts;
  const response = await apiRequest(`feed`, `${second}?${search}`, "GET");
  const data = await readApiResponse<unknown>(response);
  const posts = readPosts(data);
  const nextCursor = readNextCursor(data) ?? getCursorFromPosts(posts);
  const hasWrappedHasMore = readBoolean(data, "HasMore", "hasMore");

  return {
    Posts: posts,
    NextCursor: posts.length ? nextCursor : null,
    HasMore: hasWrappedHasMore ?? posts.length >= postPageSize,
  };
}

export async function getMyPosts() {
  const [first, second] = endpoints.getMyPosts;
  const response = await apiRequest(first, second, "GET");
  const data = await readApiResponse<unknown>(response);
  return readPosts(data);
}

export async function getLikedPosts() {
  const [first, second] = endpoints.getLikedPosts;
  const response = await apiRequest(first, second, "GET");
  const data = await readApiResponse<unknown>(response);
  return readPosts(data);
}

export async function addPost(payload: AddPostPayload) {
  const [first, second] = endpoints.addPost;
  const response = await apiRequest(first, second, "POST", payload);
  return readApiResponse<Post | null>(response);
}

export async function getComments(postID: string) {
  const search = new URLSearchParams({ postID });
  const [first, second] = endpoints.getComments;
  const response = await apiRequest(first, `${second}?${search}`, "GET");
  const data = await readApiResponse<unknown>(response);
  return readComments(data);
}

export async function addComment(payload: AddCommentPayload) {
  const [first, second] = endpoints.addComment;
  const response = await apiRequest(first, second, "POST", payload);
  const data = await readApiResponse<unknown>(response);
  return readComment(data);
}

export async function likePost(payload: AddLikePayload) {
  const [first, second] = endpoints.likePost;
  const response = await apiRequest(first, second, "POST", payload);
  return readApiResponse<unknown>(response);
}

export function toUserPublic(user: unknown): UserPublic {
  const raw = isRecord(user) ? user : {};

  return {
    Name: readString(raw, "Name", "name", ""),
    Email: readString(raw, "Email", "email", ""),
    ProfileImageLink: readNullableString(raw, "ProfileImageLink", "profileImageLink"),
    ID: readString(raw, "ID", "id", ""),
    Specialization: readNullableString(raw, "Specialization", "specialization"),
    Grade: readNumber(raw, "Grade", "grade", 0),
  };
}

function readPosts(data: unknown) {
  if (Array.isArray(data)) return data.map(toPost);
  if (!isRecord(data)) return [];

  const value = data.Posts ?? data.posts ?? data.Items ?? data.items;
  return Array.isArray(value) ? value.map(toPost) : [];
}

function toPost(value: unknown): Post {
  const raw = isRecord(value) ? value : {};

  return {
    Author: toUserPublic(readRecord(raw, "Author", "author")),
    PostID: readString(raw, "PostID", "postID", ""),
    Timestamp: readTimestamp(raw, "Timestamp", "timestamp"),
    ReplyToPostID: readNullableString(raw, "ReplyToPostID", "replyToPostID"),
    LikesNum: readNullableNumber(raw, "LikesNum", "likesNum"),
    CommentsNum: readNullableNumber(raw, "CommentsNum", "commentsNum"),
    Text: readString(raw, "Text", "text", ""),
  };
}

function readComments(data: unknown) {
  if (Array.isArray(data)) return data.map(toComment);
  if (!isRecord(data)) return [];

  const value = data.Comments ?? data.comments ?? data.Items ?? data.items;
  return Array.isArray(value) ? value.map(toComment) : [];
}

function readComment(data: unknown) {
  if (!isRecord(data)) return null;

  const value = data.Comment ?? data.comment ?? data.Item ?? data.item ?? data;
  const comment = toComment(value);
  return comment.CommentID || comment.Text ? comment : null;
}

function toComment(value: unknown): Comment {
  const raw = isRecord(value) ? value : {};

  return {
    CommentID: readString(raw, "CommentID", "commentID", ""),
    PostID: readString(raw, "PostID", "postID", ""),
    Commenter: toUserPublic(readRecord(raw, "Commenter", "commenter")),
    Text: readString(raw, "Text", "text", ""),
  };
}

function getCursorFromPosts(posts: Post[]): PostsCursor | null {
  const lastPost = posts.at(-1);
  if (!lastPost) return null;

  return {
    PostID: lastPost.PostID,
    Timestamp: lastPost.Timestamp,
  };
}

function readNextCursor(data: unknown): PostsCursor | null {
  if (!isRecord(data)) return null;
  const value = data.NextCursor ?? data.nextCursor;

  if (isRecord(value)) {
    return {
      PostID: readString(value, "PostID", "postID", ""),
      Timestamp: readTimestamp(value, "Timestamp", "timestamp"),
    };
  }

  if (typeof value === "string" && value) {
    return {
      PostID: value,
      Timestamp: "",
    };
  }

  return null;
}

function readString(
  source: Record<string, unknown>,
  key: string,
  camelKey: string,
  fallback: string,
) {
  const value = source[key] ?? source[camelKey];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readNullableString(source: Record<string, unknown>, key: string, camelKey: string) {
  const value = source[key] ?? source[camelKey];
  return typeof value === "string" ? value : null;
}

function readNumber(
  source: Record<string, unknown>,
  key: string,
  camelKey: string,
  fallback: number,
) {
  const value = source[key] ?? source[camelKey];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readNullableNumber(source: Record<string, unknown>, key: string, camelKey: string) {
  const value = source[key] ?? source[camelKey];
  if (value === null || value === undefined) return null;
  return readNumber(source, key, camelKey, 0);
}

function readTimestamp(source: Record<string, unknown>, key: string, camelKey: string) {
  const value = source[key] ?? source[camelKey];
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (isRecord(value) && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

function readBoolean(source: unknown, key: string, camelKey: string) {
  if (!isRecord(source)) return null;
  const value = source[key] ?? source[camelKey];
  return typeof value === "boolean" ? value : null;
}

function readRecord(source: Record<string, unknown>, key: string, camelKey: string) {
  const value = source[key] ?? source[camelKey];
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
