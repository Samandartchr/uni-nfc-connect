import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, X } from "lucide-react";
import { AppLayout } from "@/components/uc/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addPost, getProfile, toUserPublic } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function PostPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: getProfile,
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
    retry: false,
  });
  const postMutation = useMutation({
    mutationFn: addPost,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, navigate, user]);

  const submit = async () => {
    if (!user || !text.trim()) return;

    const currentUser = toUserPublic(profileQuery.data);
    const author = {
      ...currentUser,
      ID: currentUser.ID || user.id,
      Email: currentUser.Email || user.email,
      Name: currentUser.Name || user.full_name,
    };

    try {
      await postMutation.mutateAsync({
        Author: author,
        ReplyToPostID: null,
        Text: text.trim(),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feed-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-posts", user.id] }),
      ]);
      toast.success("Posted");
      navigate("/feed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (authLoading || !user) return null;

  return (
    <AppLayout>
      <div className="rounded-3xl bg-surface-low p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-display text-3xl">Create post</h1>
          <Button onClick={() => navigate(-1)} variant="ghost" size="icon" title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What do you want to share?"
          className="min-h-40 resize-none border-0 bg-surface-highest text-base focus-visible:ring-0"
          maxLength={500}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{text.length}/500</span>
          <Button
            onClick={submit}
            disabled={!text.trim() || postMutation.isPending || profileQuery.isLoading}
            variant="hero"
            size="sm"
          >
            {postMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Post
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}
