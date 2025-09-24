
import { useState, useEffect } from 'react';

export interface Comment {
  id: string;
  author: {
    name: string;
    initials: string;
  };
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  type: 'text' | 'image' | 'video' | 'event';
  isLiked?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  eventData?: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
  postComments?: Comment[];
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Buscar posts do Supabase
      // Por enquanto, array vazio
      setPosts([]);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      setError('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (
    content: string, 
    type: 'text' | 'image' | 'video' | 'event' = 'text', 
    mediaFile?: File, 
    eventData?: any
  ) => {
    try {
      setLoading(true);
      
      let mediaUrl: string | undefined;
      
      // Handle media file if provided
      if (mediaFile) {
        mediaUrl = URL.createObjectURL(mediaFile);
      }
      
      const newPost: Post = {
        id: Date.now().toString(),
        author: {
          name: 'Usuário',
          role: 'Membro da Equipe'
        },
        content,
        timestamp: 'agora',
        likes: 0,
        comments: 0,
        type,
        imageUrl: type === 'image' ? mediaUrl : undefined,
        videoUrl: type === 'video' ? mediaUrl : undefined,
        eventData: type === 'event' ? eventData : undefined,
        postComments: []
      };

      setPosts(prevPosts => [newPost, ...prevPosts]);
      return newPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId: string) => {
    try {
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            };
          }
          return post;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao curtir post');
    }
  };

  const addComment = async (postId: string, commentContent: string) => {
    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        author: {
          name: 'Usuário Atual',
          initials: 'UC'
        },
        content: commentContent,
        timestamp: 'agora'
      };

      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments + 1,
              postComments: [...(post.postComments || []), newComment]
            };
          }
          return post;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar comentário');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar post');
    }
  };

  const getPostComments = (postId: string): Comment[] => {
    const post = posts.find(p => p.id === postId);
    return post?.postComments || [];
  };

  return {
    posts,
    loading,
    error,
    createPost,
    likePost,
    addComment,
    deletePost,
    getPostComments
  };
};
