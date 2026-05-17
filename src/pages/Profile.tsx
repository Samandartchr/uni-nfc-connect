import { useNavigate, useParams } from "react-router-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Edit3,
  Eye,
  Heart,
  KeyRound,
  Loader2,
  LogOut,
  MessageCircle,
  Radio,
  Upload,
  RefreshCcw,
  Save,
  UserPlus,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/uc/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addFriend,
  getLikedPosts,
  getMyPosts,
  getProfile,
  getPublicProfile,
  updateProfile as updateProfileRequest,
  visitProfile,
  getToken,
  type Post,
  type UserProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { TagSelectorI18n } from "@/components/TagSelectorI18n";
import { INTEREST_KEYS, GOAL_KEYS } from "@/lib/profileOptions";
import { apiUrl } from "@/lib/api";

type AuthenticatedUser = {
  id: string;
  email: string;
  full_name: string;
};

// -------------------------------------------------------------------------
// Converts ANY stored image URL to a relative API path so it goes through
// the Vite proxy → your backend → Firebase Storage.
// Handles: old Firebase Storage URLs, new absolute API URLs, already-relative paths.
// -------------------------------------------------------------------------
function toApiImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Already a relative API path
  if (url.startsWith("/api/media/profile-image/")) return url;

  // Absolute API URL from backend (e.g. http://localhost:5165/api/media/profile-image/uid/file.jpg)
  const apiMatch = url.match(/\/api\/media\/profile-image\/([^/]+)\/(.+)$/);
  if (apiMatch) return `/api/media/profile-image/${apiMatch[1]}/${apiMatch[2]}`;

  // Legacy Firebase Storage URL (storage.googleapis.com/bucket/profile-images/uid/file.jpg)
  const firebaseMatch = url.match(/storage\.googleapis\.com\/[^/]+\/profile-images\/([^/]+)\/(.+)$/);
  if (firebaseMatch) return `/api/media/profile-image/${firebaseMatch[1]}/${firebaseMatch[2]}`;

  return url; // external URL (e.g. Google profile picture) — use as-is
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [friendSent, setFriendSent] = useState(false);
  const [scanning, setScanning] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const token = await getToken();
      const currentImageUrl = draft?.ProfileImageLink ?? profile?.ProfileImageLink ?? "";

      // 1. Get signed upload URL from backend
      const res = await fetch(
        `${apiUrl}/media/profile-image-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&oldImageUrl=${encodeURIComponent(currentImageUrl)}`,
        {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await res.json();

      // 2. PUT directly to Firebase Storage — backend never sees the bytes
      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!upload.ok) throw new Error("Upload failed");

      // 3. Normalize URL and store in draft
      updateDraft({ ProfileImageLink: toApiImageUrl(publicUrl) ?? publicUrl });
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const isPublicProfile = Boolean(userId && userId !== user?.id);
  const profileQueryKey = isPublicProfile
    ? (["public-profile", userId] as const)
    : (["profile", user?.id] as const);

  const profileFallback = useMemo<AuthenticatedUser | null>(() => {
    if (!user) return null;
    if (isPublicProfile) {
      return { id: userId ?? "", email: "", full_name: "UniConnect User" };
    }
    return user;
  }, [isPublicProfile, user, userId]);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => (isPublicProfile ? getPublicProfile(userId ?? "") : getProfile()),
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const saveMutation = useMutation({ mutationFn: updateProfileRequest });
  const addFriendMutation = useMutation({ mutationFn: addFriend });

  const myPostsQuery = useQuery({
    queryKey: ["profile-posts", user?.id],
    queryFn: getMyPosts,
    enabled: Boolean(user && !isPublicProfile),
    refetchOnWindowFocus: false,
    retry: false,
  });
  const likedPostsQuery = useQuery({
    queryKey: ["liked-posts", user?.id],
    queryFn: getLikedPosts,
    enabled: Boolean(user && !isPublicProfile),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const profile = useMemo(() => {
    if (!profileQuery.data || !profileFallback) return null;
    return normalizeProfile(profileQuery.data, profileFallback);
  }, [profileFallback, profileQuery.data]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isPublicProfile) setEditing(false);
    setFriendSent(false);
  }, [isPublicProfile, userId]);

  useEffect(() => {
    if (!isPublicProfile || !userId || !user) return;
    void visitProfile(userId).catch(() => undefined);
  }, [isPublicProfile, user, userId]);

  useEffect(() => {
    if (profile && !editing) setDraft(profile);
  }, [profile, editing]);

  const updateDraft = (patch: Partial<UserProfile>) => {
    setDraft((current) => {
      if (!current || !profileFallback || isPublicProfile) return current;
      return normalizeProfile({ ...current, ...patch }, profileFallback);
    });
  };

  const save = async () => {
    if (!draft || !profileFallback || isPublicProfile) return;
    const nextDraft = normalizeProfile(draft, profileFallback);
    try {
      const saved = await saveMutation.mutateAsync(nextDraft);
      const nextProfile = normalizeProfile(saved ?? nextDraft, profileFallback);
      queryClient.setQueryData(profileQueryKey, nextProfile);
      setDraft(nextProfile);
      setEditing(false);
      toast.success("Saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const sendFriendRequest = async () => {
    if (!profile?.ID) return;
    try {
      await addFriendMutation.mutateAsync(profile.ID);
      setFriendSent(true);
      toast.success(t("prof.pending"));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const fakeScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      toast.success(t("nfc.success"));
    }, 1600);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth");
      toast.success("Logged out");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (authLoading || !user) return null;

  if (profileQuery.isError && !profile) {
    return (
      <AppLayout>
        <div className="rounded-3xl bg-surface-low p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h1 className="text-display text-2xl">Could not load profile</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {getErrorMessage(profileQuery.error)}
          </p>
          <Button onClick={() => profileQuery.refetch()} variant="hero" size="sm" className="mt-5">
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  const p = editing ? draft : profile;

  if (!p) {
    return (
      <AppLayout>
        <div className="grid min-h-[50vh] place-items-center rounded-3xl bg-surface-low p-6 text-center">
          <div>
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-semibold text-muted-foreground">Loading profile</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const goals = p.Goals ?? [];
  const interests = p.Interests ?? [];
  const visitors = p.VisitersIDs?.length ?? 0;
  const details = [p.Specialization, p.Grade ? `${t("prof.course")} ${p.Grade}` : ""].filter(Boolean);
  const isValidInterestKey = (key: string): key is typeof INTEREST_KEYS[number] =>
    INTEREST_KEYS.includes(key as typeof INTEREST_KEYS[number]);
  const isValidGoalKey = (key: string): key is typeof GOAL_KEYS[number] =>
    GOAL_KEYS.includes(key as typeof GOAL_KEYS[number]);

  // Resolved avatar URL — always goes through API
  const avatarUrl = toApiImageUrl(p.ProfileImageLink);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative">
          {!isPublicProfile && (
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 z-10"
            >
              <LogOut className="mr-1 h-4 w-4" />
              {t("nav.signout")}
            </Button>
          )}

          <div className="flex flex-col items-center pt-2 text-center">
            {editing && (
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            )}

            <div
              className={`relative h-28 w-28 rounded-full bg-gradient-primary p-1 shadow-glow-strong ${
                editing ? "cursor-pointer" : ""
              }`}
              onClick={() => editing && avatarInputRef.current?.click()}
            >
              <div className="grid h-full w-full overflow-hidden rounded-full bg-surface-low text-4xl font-bold">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={p.Name} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center">
                    {p.Name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                )}
              </div>

              {editing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <>
                      <Edit3 className="h-5 w-5 text-white" />
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Change
                      </span>
                    </>
                  )}
                </div>
              )}

              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {editing ? (
              <Input
                value={p.Name}
                onChange={(e) => updateDraft({ Name: e.target.value })}
                className="mt-5 text-center text-2xl font-bold"
              />
            ) : (
              <h1 className="text-display mt-5 text-3xl">{p.Name || "-"}</h1>
            )}

            {editing ? (
              <div className="mt-2 grid w-full max-w-sm gap-2">
                <div className="grid grid-cols-[1fr_92px] gap-2">
                  <Input
                    value={p.Specialization ?? ""}
                    placeholder="Specialization"
                    onChange={(e) => updateDraft({ Specialization: e.target.value })}
                  />
                  <Input
                    value={p.Grade || ""}
                    min={0}
                    placeholder={t("prof.course")}
                    type="number"
                    onChange={(e) =>
                      updateDraft({
                        Grade: Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 0,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                {details.length ? details.join(" · ") : p.Email || "-"}
              </p>
            )}
          </div>

          <div className="mt-5 flex justify-center gap-2">
            {isPublicProfile ? (
              <Button
                onClick={sendFriendRequest}
                disabled={friendSent || addFriendMutation.isPending}
                variant="hero"
                size="sm"
              >
                {addFriendMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : friendSent ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                {friendSent ? t("prof.pending") : t("prof.add.friend")}
              </Button>
            ) : editing ? (
              <>
                <Button onClick={save} disabled={saveMutation.isPending} variant="hero" size="sm">
                  {saveMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {t("prof.save")}
                </Button>
                <Button
                  onClick={() => { setDraft(profile); setEditing(false); }}
                  disabled={saveMutation.isPending}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("prof.cancel")}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => { setDraft(profile); setEditing(true); }}
                variant="glass"
                size="sm"
              >
                <Edit3 className="h-3.5 w-3.5" />
                {t("prof.edit")}
              </Button>
            )}
          </div>

          <Section label={t("prof.about")}>
            {editing ? (
              <Textarea
                value={p.Bio ?? ""}
                onChange={(e) => updateDraft({ Bio: e.target.value })}
                className="border-0 bg-transparent"
                maxLength={300}
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{p.Bio || "-"}</p>
            )}
          </Section>

          <Section label={t("prof.goals")}>
            {editing ? (
              <TagSelectorI18n
                value={goals}
                onChange={(next) => updateDraft({ Goals: next })}
                optionKeys={GOAL_KEYS}
              />
            ) : goals.length ? (
              <div className="flex flex-wrap gap-2">
                {goals.map((item) => (
                  <span key={item} className="rounded-2xl bg-surface-highest px-3.5 py-1.5 text-sm font-medium">
                    {isValidGoalKey(item) ? t(item) : item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </Section>

          <Section label={t("prof.interests")}>
            {editing ? (
              <TagSelectorI18n
                value={interests}
                onChange={(next) => updateDraft({ Interests: next })}
                optionKeys={INTEREST_KEYS}
              />
            ) : interests.length ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((item) => (
                  <span key={item} className="rounded-full bg-surface-highest px-3 py-1 text-xs font-semibold text-primary">
                    #{isValidInterestKey(item) ? t(item).replace(/^#/, "") : item.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </Section>

          {!isPublicProfile && (
            <>
              <PostsSection myPostsQuery={myPostsQuery} likedPostsQuery={likedPostsQuery} />

              <Section
                label={t("prof.visitors")}
                extra={<span className="text-xs text-primary">{visitors} {t("prof.new")}</span>}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{visitors} unique visits</span>
                </div>
              </Section>

              <div className="mt-6 rounded-3xl bg-surface-low p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-highest text-primary">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t("prof.found.key")}</p>
                </div>
              </div>

              <button
                onClick={fakeScan}
                disabled={scanning}
                className="relative mt-4 flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl bg-gradient-primary px-6 py-5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-glow-strong transition hover:-translate-y-0.5 disabled:opacity-70"
              >
                {scanning && <span className="ripple-ring absolute inset-0 rounded-3xl bg-primary/40" />}
                <span className="relative grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/20">
                  <Radio className="h-4 w-4" />
                </span>
                <span className="relative">{scanning ? t("nfc.scanning") : t("prof.scan")}</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
}

// ---------- Helper Components ----------

function ProfilePostList({ posts, isLoading, isError, error }: {
  posts?: Post[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}) {
  if (isLoading) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading posts
    </div>
  );
  if (isError) return <p className="text-sm text-destructive">{getErrorMessage(error)}</p>;
  if (!posts?.length) return <p className="text-sm text-muted-foreground">No posts yet</p>;
  return (
    <div className="space-y-3">
      {posts.map((post, index) => (
        <ProfilePostCard key={post.PostID || `${post.Timestamp}-${index}`} post={post} />
      ))}
    </div>
  );
}

function PostsSection({ myPostsQuery, likedPostsQuery }: {
  myPostsQuery: { data?: Post[]; isLoading: boolean; isError: boolean; error: unknown };
  likedPostsQuery: { data?: Post[]; isLoading: boolean; isError: boolean; error: unknown };
}) {
  const [tab, setTab] = useState<"mine" | "liked">("mine");
  const active = tab === "mine" ? myPostsQuery : likedPostsQuery;

  return (
    <section className="mt-4 rounded-3xl bg-surface-low p-5">
      <div className="mb-4 flex rounded-2xl bg-surface-highest p-1">
        {(["mine", "liked"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-all ${
              tab === key
                ? "bg-gradient-primary text-primary-foreground shadow-glow-strong"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "mine" ? (
              <><MessageCircle className="h-3.5 w-3.5" /> My posts</>
            ) : (
              <><Heart className="h-3.5 w-3.5" /> Liked</>
            )}
          </button>
        ))}
      </div>
      <ProfilePostList error={active.error} isError={active.isError} isLoading={active.isLoading} posts={active.data} />
    </section>
  );
}

function ProfilePostCard({ post }: { post: Post }) {
  const navigate = useNavigate();
  // Also normalize avatar URLs in post cards
  const authorAvatarUrl = toApiImageUrl(post.Author.ProfileImageLink);

  return (
    <article className="rounded-2xl bg-surface-highest p-4">
      <button
        onClick={() => navigate(`/profile/${post.Author.ID}`)}
        className="mb-2 flex max-w-full items-center gap-2 text-left"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
          {authorAvatarUrl ? (
            <img src={authorAvatarUrl} alt={post.Author.Name} className="h-full w-full object-cover" />
          ) : (
            post.Author.Name[0]?.toUpperCase()
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{post.Author.Name}</span>
          <span className="block text-xs text-muted-foreground">{timeAgo(post.Timestamp)}</span>
        </span>
      </button>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.Text}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          {post.LikesNum ?? 0}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          {post.CommentsNum ?? 0}
        </span>
      </div>
    </article>
  );
}

function Section({ label, children, extra }: { label: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className="mt-4 rounded-3xl bg-surface-low p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-label">{label}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

// ---------- Normalization helpers ----------

function normalizeProfile(profile: UserProfile, user: AuthenticatedUser): UserProfile {
  const raw = profile as UserProfile & Record<string, unknown>;
  return {
    Name: readString(raw, "Name", "name", user.full_name),
    Email: readString(raw, "Email", "email", user.email),
    ProfileImageLink: readNullableString(raw, "ProfileImageLink", "profileImageLink"),
    ID: readString(raw, "ID", "id", user.id),
    Specialization: readNullableString(raw, "Specialization", "specialization") ?? "",
    Grade: readNumber(raw, "Grade", "grade", 0),
    Bio: readNullableString(raw, "Bio", "bio") ?? "",
    Goals: readStringList(raw, "Goals", "goals"),
    Interests: readStringList(raw, "Interests", "interests"),
    VisitersIDs: readStringList(raw, "VisitersIDs", "visitersIDs"),
    Requests: readStringList(raw, "Requests", "requests"),
    Friends: readStringList(raw, "Friends", "friends"),
    Chats: readStringList(raw, "Chats", "chats"),
    Posts: readStringList(raw, "Posts", "posts"),
  };
}

function readString(source: Record<string, unknown>, key: keyof UserProfile, camelKey: string, fallback: string) {
  const value = source[key] ?? source[camelKey];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readNullableString(source: Record<string, unknown>, key: keyof UserProfile, camelKey: string) {
  const value = source[key] ?? source[camelKey];
  return typeof value === "string" ? value : null;
}

function readNumber(source: Record<string, unknown>, key: keyof UserProfile, camelKey: string, fallback: number) {
  const value = source[key] ?? source[camelKey];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readStringList(source: Record<string, unknown>, key: keyof UserProfile, camelKey: string) {
  const value = source[key] ?? source[camelKey];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function timeAgo(value: string) {
  const timestamp = new Date(value).getTime();
  const diff = (Date.now() - timestamp) / 1000;
  if (!Number.isFinite(diff)) return "";
  if (diff < 60) return `${Math.max(0, Math.floor(diff))}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}