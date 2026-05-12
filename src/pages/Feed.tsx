import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/uc/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  addComment,
  getComments,
  getPosts,
  getProfile,
  likePost,
  toUserPublic,
  type Comment,
  type Post,
  type PostsCursor,
  type PostsPage,
  type UserPublic,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const feedPostsQueryKey = ["feed-posts"] as const;

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [openCommentsPostID, setOpenCommentsPostID] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const postsQuery = useInfiniteQuery({
    queryKey: feedPostsQueryKey,
    queryFn: ({ pageParam }: { pageParam: PostsCursor | null }) => getPosts(pageParam),
    initialPageParam: null as PostsCursor | null,
    getNextPageParam: (lastPage) => (lastPage.HasMore ? lastPage.NextCursor : undefined),
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: likePost,
  });

  const posts = useMemo(() => {
    const seen = new Set<string>();

    return (
      postsQuery.data?.pages
        .flatMap((page) => page.Posts)
        .filter((post) => {
          if (!post.PostID || seen.has(post.PostID)) return false;
          seen.add(post.PostID);
          return true;
        }) ?? []
    );
  }, [postsQuery.data]);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = postsQuery;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !user) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, user]);

  const getCurrentUserPublic = async () => {
    if (!user) throw new Error("You must be signed in.");

    const profile = await queryClient.ensureQueryData({
      queryKey: ["profile", user.id],
      queryFn: getProfile,
      staleTime: 30_000,
    });
    const publicUser = toUserPublic(profile);

    return {
      ...publicUser,
      ID: publicUser.ID || user.id,
      Email: publicUser.Email || user.email,
      Name: publicUser.Name || user.full_name,
    };
  };

  const bumpPostStat = (postID: string, key: "LikesNum" | "CommentsNum", amount: number) => {
    queryClient.setQueryData<InfiniteData<PostsPage>>(feedPostsQueryKey, (current) => {
      if (!current) return current;

      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          Posts: page.Posts.map((post) =>
            post.PostID === postID
              ? { ...post, [key]: Math.max(0, (post[key] ?? 0) + amount) }
              : post,
          ),
        })),
      };
    });
  };

  const handleLike = async (post: Post) => {
    if (likedPosts.has(post.PostID)) return;

    setLikedPosts((current) => new Set(current).add(post.PostID));
    bumpPostStat(post.PostID, "LikesNum", 1);

    try {
      const liker = await getCurrentUserPublic();
      await likeMutation.mutateAsync({ PostID: post.PostID, Liker: liker });
    } catch (error) {
      setLikedPosts((current) => {
        const next = new Set(current);
        next.delete(post.PostID);
        return next;
      });
      bumpPostStat(post.PostID, "LikesNum", -1);
      toast.error(getErrorMessage(error));
    }
  };

  const handleCommentCreated = (postID: string) => {
    bumpPostStat(postID, "CommentsNum", 1);
  };

  if (authLoading || !user) return null;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-display text-3xl">{t("feed.title")}</h1>
      </div>

      {postsQuery.isLoading ? (
        <FeedStatus icon={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
          Loading posts
        </FeedStatus>
      ) : postsQuery.isError ? (
        <FeedStatus icon={<AlertCircle className="h-8 w-8 text-destructive" />}>
          <div className="space-y-4">
            <p>{getErrorMessage(postsQuery.error)}</p>
            <Button onClick={() => postsQuery.refetch()} variant="hero" size="sm">
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        </FeedStatus>
      ) : posts.length === 0 ? (
        <FeedStatus>{t("feed.empty")}</FeedStatus>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => (
            <motion.article
              key={post.PostID}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.4) }}
              className="rounded-3xl bg-surface-low p-5 transition hover:bg-surface-high"
            >
              <PostHeader author={post.Author} timestamp={post.Timestamp} />
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.Text}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <button
                  onClick={() => handleLike(post)}
                  disabled={likedPosts.has(post.PostID)}
                  className={`inline-flex items-center gap-1.5 transition ${
                    likedPosts.has(post.PostID) ? "text-secondary" : "hover:text-foreground"
                  }`}
                >
                  <Heart
                    className={`h-3.5 w-3.5 ${likedPosts.has(post.PostID) ? "fill-current" : ""}`}
                  />
                  {post.LikesNum ?? 0}
                </button>
                <button
                  onClick={() =>
                    setOpenCommentsPostID((current) =>
                      current === post.PostID ? null : post.PostID,
                    )
                  }
                  className="inline-flex items-center gap-1.5 transition hover:text-foreground"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.CommentsNum ?? 0}
                </button>
              </div>
              {openCommentsPostID === post.PostID && (
                <CommentsPanel
                  postID={post.PostID}
                  getCurrentUserPublic={getCurrentUserPublic}
                  onCommentCreated={handleCommentCreated}
                />
              )}
            </motion.article>
          ))}

          <div ref={loadMoreRef} className="py-4 text-center text-xs text-muted-foreground">
            {postsQuery.isFetchingNextPage ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading more
              </span>
            ) : postsQuery.hasNextPage ? (
              "Scroll for more"
            ) : (
              "No more posts"
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function PostHeader({ author, timestamp }: { author: UserPublic; timestamp: string }) {
  const navigate = useNavigate();
  console.log("author data:", author);

  return (
    <header className="mb-3 flex items-center gap-3">
      <button
  onClick={() => navigate(`/profile/${author.ID}`)}
  className="flex min-w-0 flex-1 items-center gap-3 text-left"
>
  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-primary font-bold text-primary-foreground">
    {author.ProfileImageLink ? (
      <img src={author.ProfileImageLink} alt={author.Name} className="h-full w-full object-cover" />
    ) : (
      author.Name[0]?.toUpperCase()
    )}
  </span>
  <span className="min-w-0">
    <span className="block truncate text-sm font-semibold">{author.Name}</span>
    <span className="block truncate text-xs text-muted-foreground">
      {formatUserLine(author)} · {timeAgo(timestamp)}
    </span>
  </span>
</button>
    </header>
  );
}

function CommentsPanel({
  postID,
  getCurrentUserPublic,
  onCommentCreated,
}: {
  postID: string;
  getCurrentUserPublic: () => Promise<UserPublic>;
  onCommentCreated: (postID: string) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const commentsQueryKey = ["post-comments", postID] as const;
  const commentsQuery = useQuery({
    queryKey: commentsQueryKey,
    queryFn: () => getComments(postID),
    refetchOnWindowFocus: false,
    retry: false,
  });
  const commentMutation = useMutation({
    mutationFn: addComment,
  });

  const submitComment = async () => {
    const nextText = text.trim();
    if (!nextText) return;

    try {
      const commenter = await getCurrentUserPublic();
      const created = await commentMutation.mutateAsync({
        PostID: postID,
        Commenter: commenter,
        Text: nextText,
      });
      const nextComment =
        created ??
        ({
          CommentID: `local-${postID}-${Date.now()}`,
          PostID: postID,
          Commenter: commenter,
          Text: nextText,
        } satisfies Comment);

      queryClient.setQueryData<Comment[]>(commentsQueryKey, (current) => [
        ...(current ?? []),
        nextComment,
      ]);
      onCommentCreated(postID);
      setText("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="mt-4 rounded-2xl bg-surface-highest p-3">
      {commentsQuery.isLoading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading comments
        </div>
      ) : commentsQuery.isError ? (
        <div className="py-3 text-xs text-destructive">{getErrorMessage(commentsQuery.error)}</div>
      ) : commentsQuery.data?.length ? (
        <div className="space-y-3">
          {commentsQuery.data.map((comment, index) => (
            <div key={comment.CommentID || `${comment.PostID}-${index}`} className="flex gap-2">
              <button
                onClick={() => navigate(`/profile/${comment.Commenter.ID}`)}
                className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-low text-xs font-bold"
              >
                {comment.Commenter.ProfileImageLink ? (
                  <img
                    src={comment.Commenter.ProfileImageLink}
                    alt={comment.Commenter.Name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  comment.Commenter.Name[0]?.toUpperCase()
                )}
              </button>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => navigate(`/profile/${comment.Commenter.ID}`)}
                  className="truncate text-xs font-semibold hover:text-primary"
                >
                  {comment.Commenter.Name}
                </button>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.Text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-3 text-xs text-muted-foreground">No comments yet</div>
      )}

      <div className="mt-3 flex gap-2">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a comment"
          className="min-h-10 resize-none rounded-2xl border-0 bg-surface-low text-sm focus-visible:ring-0"
          maxLength={500}
        />
        <Button
          onClick={submitComment}
          disabled={!text.trim() || commentMutation.isPending}
          variant="hero"
          size="icon"
          title="Send"
        >
          {commentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function FeedStatus({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-surface-low p-10 text-center text-sm text-muted-foreground">
      {icon && <div className="mb-3 flex justify-center">{icon}</div>}
      {children}
    </div>
  );
}

function formatUserLine(user: UserPublic) {
  const items = [user.Specialization, user.Grade ? `Year ${user.Grade}` : ""].filter(Boolean);

  return items.length ? items.join(" · ") : user.Email || "-";
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
