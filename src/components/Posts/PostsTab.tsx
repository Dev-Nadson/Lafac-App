import React, { useState } from 'react';
import { MessageSquare, Plus, Calendar, Users, Upload, Clock, ExternalLink, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Post, PostStatus, PostAssignment } from '../../types';
import toast from 'react-hot-toast';

const PostsTab: React.FC = () => {
  const { posts, addPost, updatePost, deletePost, users, events } = useData();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'All'>('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusColor = (status: PostStatus) => {
    const colors = {
      'In Production': 'bg-yellow-100 text-yellow-800',
      'Posted': 'bg-blue-100 text-blue-800',
      'Expired': 'bg-red-100 text-red-800',
      'Done': 'bg-green-100 text-green-800'
    };
    return colors[status];
  };

  const getStatusIcon = (status: PostStatus) => {
    switch (status) {
      case 'Done': return <CheckCircle className="w-4 h-4" />;
      case 'Expired': return <XCircle className="w-4 h-4" />;
      case 'Posted': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusEmoji = (status: PostStatus) => {
    const emojis = {
      'In Production': '🟨',
      'Posted': '🔵',
      'Expired': '🔴',
      'Done': '🟩'
    };
    return emojis[status];
  };

  const getRoleEmoji = (role: string) => {
    const emojis = {
      'Instagram Art Designer': '🎨',
      'Video Editor': '🎬',
      'Scientific Researcher': '🔍',
      'Caption Writer': '✍️'
    };
    return emojis[role as keyof typeof emojis] || '📝';
  };

  const filteredPosts = posts.filter(post => 
    statusFilter === 'All' || post.status === statusFilter
  );

  const PostModal: React.FC<{ 
    post?: Post | null; 
    onSave: (postData: any) => void; 
    onClose: () => void;
    currentUserId?: string;
  }> = ({ post, onSave, onClose, currentUserId }) => {
    const [formData, setFormData] = useState({
      title: post?.title || '',
      description: post?.description || '',
      deadline: post?.deadline || '',
      status: post?.status || 'In Production' as PostStatus,
      relatedEventId: post?.relatedEventId || '',
      assignedRoles: post?.assignedRoles || [] as PostAssignment[],
      postType: post?.postType || 'Feed Post' as Post['postType']
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
      const newErrors: Record<string, string> = {};
      
      if (!formData.title.trim()) {
        newErrors.title = 'Título é obrigatório';
      }
      
      if (!formData.deadline) {
        newErrors.deadline = 'Prazo é obrigatório';
      } else {
        const deadlineDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deadlineDate < today) {
          newErrors.deadline = 'Prazo não pode ser no passado';
        }
      }
      
      if (formData.assignedRoles.length === 0) {
        newErrors.assignedRoles = 'Pelo menos uma função deve ser atribuída';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validateForm()) {
        toast.error('Por favor, corrija os erros no formulário');
        return;
      }

      setIsSubmitting(true);
      try {
        const postData = {
          ...formData,
          // Convert empty string to null for UUID fields
          relatedEventId: formData.relatedEventId || null,
          date: post?.date || new Date().toISOString().split('T')[0],
          mediaUploads: post?.mediaUploads || [],
          createdBy: post?.createdBy || currentUserId
        };

        await onSave(postData);
        toast.success(post ? 'Post atualizado com sucesso!' : 'Post criado com sucesso!');
      } catch (error) {
        console.error('Error saving post:', error);
        toast.error('Erro ao salvar post');
      } finally {
        setIsSubmitting(false);
      }
    };

    const addRole = () => {
      setFormData({
        ...formData,
        assignedRoles: [...formData.assignedRoles, {
          role: 'Instagram Art Designer',
          completed: false
        }]
      });
    };

    const updateRole = (index: number, updates: Partial<PostAssignment>) => {
      const newRoles = [...formData.assignedRoles];
      newRoles[index] = { ...newRoles[index], ...updates };
      setFormData({ ...formData, assignedRoles: newRoles });
    };

    const removeRole = (index: number) => {
      setFormData({
        ...formData,
        assignedRoles: formData.assignedRoles.filter((_, i) => i !== index)
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
                {post ? 'Editar Post' : 'Criar Novo Post'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ExternalLink className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Informações Básicas</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ex: Post sobre Farmácia Clínica"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descreva o conteúdo do post..."
                    />
                  </div>
                </div>
              </div>

              {/* Post Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Detalhes do Post</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prazo *</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.deadline ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.deadline && (
                      <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as PostStatus})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="In Production">Em Produção</option>
                      <option value="Posted">Postado</option>
                      <option value="Expired">Expirado</option>
                      <option value="Done">Concluído</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Post</label>
                    <select
                      value={formData.postType}
                      onChange={(e) => setFormData({...formData, postType: e.target.value as Post['postType']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Feed Post">Post do Feed</option>
                      <option value="Reel">Reel</option>
                      <option value="Story">Story</option>
                      <option value="Carrossel">Carrossel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evento Relacionado (Opcional)</label>
                    <select
                      value={formData.relatedEventId}
                      onChange={(e) => setFormData({...formData, relatedEventId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Nenhum evento</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>{event.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Assigned Roles */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Funções Atribuídas *</h4>
                  <button
                    type="button"
                    onClick={addRole}
                    className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Função
                  </button>
                </div>
                
                {formData.assignedRoles.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma função atribuída ainda</p>
                    <p className="text-sm">Clique em "Adicionar Função" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.assignedRoles.map((role, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex-1">
                          <select
                            value={role.role}
                            onChange={(e) => updateRole(index, { role: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Instagram Art Designer">🎨 Designer de Arte Instagram</option>
                            <option value="Video Editor">🎬 Editor de Vídeo</option>
                            <option value="Scientific Researcher">🔍 Pesquisador Científico</option>
                            <option value="Caption Writer">✍️ Redator de Legenda</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <select
                            value={role.assignedTo || ''}
                            onChange={(e) => updateRole(index, { assignedTo: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Atribuir para...</option>
                            {users.filter(u => u.isActive).map(user => (
                              <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRole(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover função"
                        >
                          <ExternalLink className="w-4 h-4 rotate-45" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {errors.assignedRoles && (
                  <p className="mt-2 text-sm text-red-600">{errors.assignedRoles}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {post ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 mr-2" />
                      {post ? 'Atualizar' : 'Criar'} Post
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este post?')) {
      return;
    }

    try {
      await deletePost(postId);
      toast.success('Post deletado com sucesso!');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erro ao deletar post');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Post
        </button>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filtrar por Status:</span>
          <div className="flex flex-wrap gap-2">
            {(['All', 'In Production', 'Posted', 'Expired', 'Done'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status !== 'All' && getStatusEmoji(status as PostStatus)} {status === 'All' ? 'Todos' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPosts.map(post => {
          const relatedEvent = post.relatedEventId ? events.find(e => e.id === post.relatedEventId) : null;
          const isOverdue = new Date(post.deadline) < new Date() && post.status !== 'Done' && post.status !== 'Posted';
          
          return (
            <div
              key={post.id}
              className={`bg-white rounded-lg shadow-sm border-l-4 p-6 hover:shadow-md transition-shadow ${
                isOverdue ? 'border-l-red-500' :
                post.status === 'Done' ? 'border-l-green-500' :
                'border-l-blue-500'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {getStatusIcon(post.status)}
                      <span className="ml-1">{post.status}</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {post.postType}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Atrasado
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingPost(post)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar post"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deletar post"
                  >
                    <ExternalLink className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>

              {post.description && (
                <p className="text-gray-600 text-sm mb-4">{post.description}</p>
              )}

              {/* Deadline */}
              <div className="flex items-center space-x-2 mb-4 text-sm">
                <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                  Prazo: {new Date(post.deadline).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Related Event */}
              {relatedEvent && (
                <div className="flex items-center space-x-2 mb-4 text-sm text-blue-600">
                  <Calendar className="w-4 h-4" />
                  <span>Relacionado a: {relatedEvent.title}</span>
                </div>
              )}

              {/* Assigned Roles */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Funções Atribuídas:</h4>
                {post.assignedRoles.length > 0 ? (
                  post.assignedRoles.map((assignment, index) => {
                    const assignedUser = assignment.assignedTo ? users.find(u => u.id === assignment.assignedTo) : null;
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {getRoleEmoji(assignment.role)} {assignment.role}
                          </span>
                          {assignedUser && (
                            <span className="text-xs text-gray-600">
                              → {assignedUser.name}
                            </span>
                          )}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${assignment.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 italic">Nenhuma função atribuída</p>
                )}
              </div>

              {/* Media Uploads */}
              {post.mediaUploads && post.mediaUploads.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Upload className="w-4 h-4" />
                    <span>{post.mediaUploads.length} arquivo(s) de mídia enviado(s)</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum post encontrado</h3>
          <p className="text-gray-500 mb-4">
            {statusFilter === 'All' 
              ? 'Crie seu primeiro post para começar.' 
              : `Nenhum post com status "${statusFilter}".`
            }
          </p>
          {statusFilter === 'All' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Post
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <PostModal
          currentUserId={user?.id}
          onSave={async (postData) => {
            await addPost(postData);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingPost && (
        <PostModal
          post={editingPost}
          currentUserId={user?.id}
          onSave={async (postData) => {
            await updatePost(editingPost.id, postData);
            setEditingPost(null);
          }}
          onClose={() => setEditingPost(null)}
        />
      )}
    </div>
  );
};

export default PostsTab;