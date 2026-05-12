import { useNavigate, useParams } from "react-router-dom";
import {
  useEffect,
  useMemo,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
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
  MessageCircle,
  Plus,
  Radio,
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
  type Post,
  type UserProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

type AuthenticatedUser = {
  id: string;
  email: string;
  full_name: string;
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [friendSent, setFriendSent] = useState(false);
  const [scanning, setScanning] = useState(false);

  const isPublicProfile = Boolean(userId && userId !== user?.id);
  const profileQueryKey = isPublicProfile
    ? (["public-profile", userId] as const)
    : (["profile", user?.id] as const);
  const profileFallback = useMemo<AuthenticatedUser | null>(() => {
    if (!user) return null;
    if (isPublicProfile) {
      return {
        id: userId ?? "",
        email: "",
        full_name: "UniConnect User",
      };
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
  const saveMutation = useMutation({
    mutationFn: updateProfileRequest,
  });
  const addFriendMutation = useMutation({
    mutationFn: addFriend,
  });
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
  const details = [p.Specialization, p.Grade ? `${t("prof.course")} ${p.Grade}` : ""].filter(
    Boolean,
  );

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col items-center pt-2 text-center">
          <div className="h-28 w-28 rounded-full bg-gradient-primary p-1 shadow-glow-strong">
            <div className="grid h-full w-full overflow-hidden rounded-full bg-surface-low text-4xl font-bold">
              {p.ProfileImageLink ? (
                <img src={p.ProfileImageLink} alt={p.Name} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center">
                  {p.Name?.[0]?.toUpperCase() ?? "U"}
                </span>
              )}
            </div>
          </div>

          {editing ? (
            <Input
              value={p.Name}
              onChange={(event) => updateDraft({ Name: event.target.value })}
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
                  onChange={(event) => updateDraft({ Specialization: event.target.value })}
                />
                <Input
                  value={p.Grade || ""}
                  min={0}
                  placeholder={t("prof.course")}
                  type="number"
                  onChange={(event) =>
                    updateDraft({
                      Grade: Number.isFinite(event.target.valueAsNumber)
                        ? event.target.valueAsNumber
                        : 0,
                    })
                  }
                />
              </div>
              <Input
                value={p.ProfileImageLink ?? ""}
                placeholder="Profile image URL"
                onChange={(event) => updateDraft({ ProfileImageLink: event.target.value })}
              />
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
                onClick={() => {
                  setDraft(profile);
                  setEditing(false);
                }}
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
              onClick={() => {
                setDraft(profile);
                setEditing(true);
              }}
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
              onChange={(event) => updateDraft({ Bio: event.target.value })}
              className="border-0 bg-transparent"
              maxLength={300}
            />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">{p.Bio || "-"}</p>
          )}
        </Section>

        <Section label={t("prof.goals")}>
          {editing ? (
            <TagEditor
              value={goals}
              onChange={(next) => updateDraft({ Goals: next })}
              placeholder="Add a goal"
            />
          ) : goals.length ? (
            <div className="flex flex-wrap gap-2">
              {goals.map((goal) => (
                <span
                  key={goal}
                  className="rounded-2xl bg-surface-highest px-3.5 py-1.5 text-sm font-medium"
                >
                  {goal}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </Section>

        <Section label={t("prof.interests")}>
          {editing ? (
            <TagEditor
              value={interests}
              onChange={(next) => updateDraft({ Interests: next })}
              placeholder="Add an interest"
            />
          ) : interests.length ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-surface-highest px-3 py-1 text-xs font-semibold text-primary"
                >
                  #{interest.replace(/^#/, "")}
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
              extra={
                <span className="text-xs text-primary">
                  {visitors} {t("prof.new")}
                </span>
              }
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
              {scanning && (
                <span className="ripple-ring absolute inset-0 rounded-3xl bg-primary/40" />
              )}
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/20">
                <Radio className="h-4 w-4" />
              </span>
              <span className="relative">{scanning ? t("nfc.scanning") : t("prof.scan")}</span>
            </button>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
}

function ProfilePostList({
  posts,
  isLoading,
  isError,
  error,
}: {
  posts?: Post[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading posts
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">{getErrorMessage(error)}</p>;
  }

  if (!posts?.length) {
    return <p className="text-sm text-muted-foreground">No posts yet</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post, index) => (
        <ProfilePostCard key={post.PostID || `${post.Timestamp}-${index}`} post={post} />
      ))}
    </div>
  );
}

function PostsSection({
  myPostsQuery,
  likedPostsQuery,
}: {
  myPostsQuery: { data?: Post[]; isLoading: boolean; isError: boolean; error: unknown };
  likedPostsQuery: { data?: Post[]; isLoading: boolean; isError: boolean; error: unknown };
}) {
  const [tab, setTab] = useState<"mine" | "liked">("mine");

  const active = tab === "mine" ? myPostsQuery : likedPostsQuery;

  return (
    <section className="mt-4 rounded-3xl bg-surface-low p-5">
      {/* Toggle */}
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

      <ProfilePostList
        error={active.error}
        isError={active.isError}
        isLoading={active.isLoading}
        posts={active.data}
      />
    </section>
  );
}

function ProfilePostCard({ post }: { post: Post }) {
  const navigate = useNavigate();

  return (
    <article className="rounded-2xl bg-surface-highest p-4">
      <button
        onClick={() => navigate(`/profile/${post.Author.ID}`)}
        className="mb-2 flex max-w-full items-center gap-2 text-left"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
          {post.Author.ProfileImageLink ? (
            <img
              src={post.Author.ProfileImageLink}
              alt={post.Author.Name}
              className="h-full w-full object-cover"
            />
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

function TagEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [entry, setEntry] = useState("");

  const commit = (rawValue = entry) => {
    const additions = rawValue.split(/[,\n]/).map(cleanTag).filter(Boolean);

    if (!additions.length) return;

    const seen = new Set(value.map(normalizeTag));
    const next = [...value];

    additions.forEach((item) => {
      const key = normalizeTag(item);
      if (!key || seen.has(key)) return;
      seen.add(key);
      next.push(item);
    });

    onChange(next);
    setEntry("");
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
      return;
    }

    if (event.key === "Backspace" && !entry && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!/[,\n]/.test(pasted)) return;

    event.preventDefault();
    commit(pasted);
  };

  return (
    <div className="rounded-2xl bg-surface-highest p-2">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex h-8 max-w-full items-center gap-1 rounded-full bg-surface-low px-3 text-sm font-medium"
          >
            <span className="max-w-[180px] truncate">{item}</span>
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-high hover:text-foreground"
              title="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Input
          value={entry}
          onChange={(event) => setEntry(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => commit()}
          placeholder={placeholder}
          className="h-8 min-w-32 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={() => commit()}
          disabled={!entry.trim()}
          title="Add"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
  extra,
}: {
  label: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
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

function readString(
  source: Record<string, unknown>,
  key: keyof UserProfile,
  camelKey: string,
  fallback: string,
) {
  const value = source[key] ?? source[camelKey];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readNullableString(
  source: Record<string, unknown>,
  key: keyof UserProfile,
  camelKey: string,
) {
  const value = source[key] ?? source[camelKey];
  return typeof value === "string" ? value : null;
}

function readNumber(
  source: Record<string, unknown>,
  key: keyof UserProfile,
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

function readStringList(source: Record<string, unknown>, key: keyof UserProfile, camelKey: string) {
  const value = source[key] ?? source[camelKey];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function cleanTag(value: string) {
  return value.trim().replace(/^#+/, "").replace(/\s+/g, " ");
}

function normalizeTag(value: string) {
  return cleanTag(value).toLowerCase();
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
