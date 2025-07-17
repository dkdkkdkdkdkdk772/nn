import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Mail, 
  Phone, 
  MapPin,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  Crown,
  Shield,
  User,
  Globe,
  Copy,
  ExternalLink,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { Eye } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { organizationService, Organization as ApiOrganization, CreateOrganizationData, UpdateOrganizationData } from '../services/organizationService';
import { authService } from '../services/authService';

const OrganizationManagement: React.FC = () => {
  const { currentOrganization, updateOrganization, addOrganization, removeOrganization, loadUserOrganization, loading: contextLoading } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
  });

  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
  });

  const [addUserFormData, setAddUserFormData] = useState({
    email: '',
  });

  // Get current user for role checking
  const currentUser = authService.getStoredUser();
  const isOwner = currentOrganization?.role === 'owner';
  const isAdmin = currentOrganization?.role === 'admin' || isOwner;

  // Initialize form data when organization loads
  useEffect(() => {
    if (currentOrganization) {
      setEditFormData({
        name: currentOrganization.name || '',
        email: currentOrganization.email || '',
        address: currentOrganization.address || '',
        phone: currentOrganization.phone || '',
      });
    }
  }, [currentOrganization]);

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      email: '',
      address: '',
      phone: '',
    });
    setValidationErrors({});
  };

  const resetAddUserForm = () => {
    setAddUserFormData({
      email: '',
    });
    setValidationErrors({});
  };

  const validateForm = (data: typeof createFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) {
      errors.name = 'Le nom de l\'organisation est obligatoire';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!data.email.trim()) {
      errors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (data.phone && !/^[\+]?[1-9][\d\s\-\(\)]{7,15}$/.test(data.phone.replace(/\s/g, ''))) {
      errors.phone = 'Format de téléphone invalide';
    }

    return errors;
  };

  const validateAddUserForm = (data: typeof addUserFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.email.trim()) {
      errors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Format d\'email invalide';
    }

    return errors;
  };

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setSuccess(null);
  };

  const handleEdit = () => {
    if (!isAdmin) {
      showErrorMessage('Vous n\'avez pas les permissions pour modifier cette organisation');
      return;
    }
    setIsEditing(true);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    // Reset form data
    if (currentOrganization) {
      setEditFormData({
        name: currentOrganization.name || '',
        email: currentOrganization.email || '',
        address: currentOrganization.address || '',
        phone: currentOrganization.phone || '',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!currentOrganization) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const updateData: UpdateOrganizationData = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        address: editFormData.address.trim() || undefined,
        phone: editFormData.phone.trim() || undefined,
      };

      const updatedOrg = await organizationService.updateOrganization(currentOrganization.id, updateData);
      
      // Update the organization in context
      updateOrganization({
        ...currentOrganization,
        ...updatedOrg,
        avatar: currentOrganization.avatar,
        role: currentOrganization.role,
        memberCount: currentOrganization.memberCount,
        plan: currentOrganization.plan,
      });

      setIsEditing(false);
      showSuccessMessage('Organisation mise à jour avec succès ! ✅');
    } catch (err) {
      console.error('Failed to update organization:', err);
      showErrorMessage(err instanceof Error ? err.message : 'Échec de la mise à jour de l\'organisation');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    const errors = validateForm(createFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const createData: CreateOrganizationData = {
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        address: createFormData.address.trim() || undefined,
        phone: createFormData.phone.trim() || undefined,
      };

      const newOrg = await organizationService.createOrganization(createData);
      
      // Add to context as owner
      const organizationWithRole = {
        ...newOrg,
        role: 'owner' as const,
        avatar: newOrg.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2),
        memberCount: 1,
        plan: 'professional' as const,
      };
      
      addOrganization(organizationWithRole);
      
      // Reload user organization to get the updated user data
      await loadUserOrganization();
      
      setShowCreateModal(false);
      resetCreateForm();
      showSuccessMessage('Organisation créée avec succès ! 🎉');
    } catch (err) {
      console.error('Failed to create organization:', err);
      showErrorMessage(err instanceof Error ? err.message : 'Échec de la création de l\'organisation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!currentOrganization) return;

    if (!isOwner) {
      showErrorMessage('Seul le propriétaire peut supprimer l\'organisation');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await organizationService.deleteOrganization(currentOrganization.id);
      
      removeOrganization(currentOrganization.id);
      setShowDeleteModal(false);
      showSuccessMessage('Organisation supprimée avec succès ! 🗑️');
    } catch (err) {
      console.error('Failed to delete organization:', err);
      showErrorMessage(err instanceof Error ? err.message : 'Échec de la suppression de l\'organisation');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!currentOrganization) return;

    const errors = validateAddUserForm(addUserFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const response = await organizationService.addUserByEmail(
        currentOrganization.id, 
        addUserFormData.email.trim()
      );

      setShowAddUserModal(false);
      resetAddUserForm();
      showSuccessMessage(`Utilisateur ${response.user.name} (${response.user.email}) ajouté avec succès ! 👥`);
    } catch (err) {
      console.error('Failed to add user:', err);
      showErrorMessage(err instanceof Error ? err.message : 'Échec de l\'ajout de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessMessage('Copié dans le presse-papiers !');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-yellow-500" />;
      case 'admin':
        return <Shield size={16} className="text-blue-500" />;
      case 'member':
        return <User size={16} className="text-green-500" />;
      default:
        return <User size={16} className="text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'admin':
        return 'Administrateur';
      case 'member':
        return 'Membre';
      default:
        return 'Membre';
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'professional':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'starter':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'Entreprise';
      case 'professional':
        return 'Professionnel';
      case 'starter':
        return 'Débutant';
      default:
        return plan;
    }
  };

  if (contextLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
          <p className="text-gray-600 ml-4">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl w-24 h-24 mx-auto flex items-center justify-center shadow-2xl">
                <Building size={40} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-2 animate-pulse">
                <Sparkles size={16} className="text-white" />
              </div>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Bienvenue dans GDPilia !</h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Pour commencer à utiliser GDPilia, vous devez créer ou rejoindre une organisation. 
              Une organisation vous permet de collaborer avec votre équipe et de gérer vos données ensemble.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              {/* Create Organization Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Plus size={32} className="text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Créer une Organisation</h4>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Créez votre propre organisation et invitez votre équipe à vous rejoindre. 
                  Vous serez automatiquement le propriétaire avec tous les droits d'administration.
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Contrôle total de l'organisation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Inviter des membres</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Gérer les paramètres</span>
                  </li>
                </ul>
                <button
                  onClick={() => {
                    resetCreateForm();
                    setShowCreateModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Plus size={20} />
                  <span>Créer une Organisation</span>
                </button>
              </div>

              {/* Join Organization Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <UserPlus size={32} className="text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Rejoindre une Organisation</h4>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Rejoignez une organisation existante en utilisant un code d'invitation ou 
                  en demandant à être ajouté par un administrateur.
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Accès immédiat aux données</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Collaboration d'équipe</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Partage des ressources</span>
                  </li>
                </ul>
                <button
                  onClick={() => {
                    // Navigate to join organization view
                    window.location.href = '#join-organization';
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <UserPlus size={20} />
                  <span>Rejoindre une Organisation</span>
                </button>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Besoin d'aide ?</h4>
              <p className="text-gray-600 mb-6">
                Si vous avez des questions sur la création ou la gestion d'organisations, 
                consultez notre documentation ou contactez notre support.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button className="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                  📚 Documentation
                </button>
                <button className="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                  💬 Contacter le Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Gestion de l'Organisation</h3>
          <p className="text-gray-600 mt-1">Gérez les informations et paramètres de votre organisation</p>
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <UserPlus size={20} />
              <span>Ajouter un Utilisateur</span>
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            <span>Nouvelle Organisation</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <span className="text-green-800 font-medium">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-600 hover:text-green-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <span className="text-red-800 font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Organization Details */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl w-20 h-20 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {currentOrganization.avatar}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">{currentOrganization.name}</h2>
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(currentOrganization.role || 'member')}
                    <span className="text-sm font-medium text-gray-600">
                      {getRoleLabel(currentOrganization.role || 'member')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPlanBadge(currentOrganization.plan || 'professional')}`}>
                    {getPlanLabel(currentOrganization.plan || 'professional')}
                  </span>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-sm">ID:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      {currentOrganization.id}
                    </code>
                    <button
                      onClick={() => copyToClipboard(currentOrganization.id.toString())}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copier l'ID"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <>
                  {isAdmin && (
                    <button
                      onClick={handleEdit}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <Edit size={18} />
                      <span>Modifier</span>
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <Trash2 size={18} />
                      <span>Supprimer</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Organization Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Building size={24} className="text-blue-600" />
                <span>Informations de l'Organisation</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'organisation</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Nom de l'organisation"
                      />
                      {validationErrors.name && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <Building size={20} className="text-blue-600" />
                      <span className="font-medium text-gray-900">{currentOrganization.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Email de l'organisation"
                      />
                      {validationErrors.email && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <Mail size={20} className="text-green-600" />
                      <span className="text-gray-900">{currentOrganization.email || 'Non renseigné'}</span>
                      {currentOrganization.email && (
                        <a
                          href={`mailto:${currentOrganization.email}`}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="Envoyer un email"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Numéro de téléphone"
                      />
                      {validationErrors.phone && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.phone}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <Phone size={20} className="text-purple-600" />
                      <span className="text-gray-900">{currentOrganization.phone || 'Non renseigné'}</span>
                      {currentOrganization.phone && (
                        <a
                          href={`tel:${currentOrganization.phone}`}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="Appeler"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  {isEditing ? (
                    <textarea
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Adresse complète de l'organisation"
                    />
                  ) : (
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                      <MapPin size={20} className="text-red-600 mt-0.5" />
                      <span className="text-gray-900">{currentOrganization.address || 'Non renseignée'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Organization Stats */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Users size={24} className="text-green-600" />
                <span>Statistiques & Informations</span>
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600 rounded-xl p-3">
                      <Users size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Membres</p>
                      <p className="text-3xl font-bold text-blue-900">{currentOrganization.memberCount || 1}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-600 rounded-xl p-3">
                      <Calendar size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700 font-medium">Créée le</p>
                      <p className="text-lg font-semibold text-green-900">
                        {currentOrganization.created_at 
                          ? new Date(currentOrganization.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Non disponible'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-600 rounded-xl p-3">
                      <Building size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Plan</p>
                      <p className="text-lg font-semibold text-purple-900 capitalize">
                        {getPlanLabel(currentOrganization.plan || 'professional')}
                      </p>
                    </div>
                  </div>
                </div>

                {currentUser && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-600 rounded-xl p-3">
                        {getRoleIcon(currentOrganization.role || 'member')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Votre rôle</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {getRoleLabel(currentOrganization.role || 'member')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Informations supplémentaires</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dernière mise à jour:</span>
                    <span className="font-medium text-gray-900">
                      {currentOrganization.updated_at 
                        ? new Date(currentOrganization.updated_at).toLocaleDateString('fr-FR')
                        : 'Non disponible'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type de compte:</span>
                    <span className="font-medium text-gray-900">Organisation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    <span className="font-medium text-green-600">Actif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3">
                    <UserPlus size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Ajouter un Utilisateur</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    resetAddUserForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de l'utilisateur *
                  </label>
                  <input
                    type="email"
                    value={addUserFormData.email}
                    onChange={(e) => setAddUserFormData({ ...addUserFormData, email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="utilisateur@example.com"
                  />
                  {validationErrors.email && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Information importante</p>
                      <p>L'utilisateur doit déjà avoir un compte dans le système. Saisissez l'email de son compte existant pour l'ajouter à votre organisation.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    resetAddUserForm();
                  }}
                  disabled={loading}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!addUserFormData.email || loading}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <UserPlus size={20} />
                  )}
                  <span>{loading ? 'Ajout...' : 'Ajouter l\'Utilisateur'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3">
                    <Plus size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Créer une Nouvelle Organisation</h3>
                    <p className="text-sm text-gray-600">Configurez votre organisation et commencez à collaborer</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-semibold">
                      1
                    </div>
                    <span className="text-sm font-medium text-gray-900">Informations de base</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-500 text-sm font-semibold">
                      2
                    </div>
                    <span className="text-sm text-gray-500">Confirmation</span>
                  </div>
                </div>
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Information importante</p>
                      <p>En créant cette organisation, vous deviendrez automatiquement le propriétaire avec tous les droits d'administration. Vous rejoindrez automatiquement cette organisation et pourrez inviter d'autres membres.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'organisation *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Choisissez un nom descriptif pour votre organisation (ex: "Mon Entreprise SARL", "Équipe Marketing")
                  </p>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Entrez le nom de votre organisation"
                  />
                  {validationErrors.name && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contact *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Email principal pour les communications officielles de l'organisation
                  </p>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="contact@votre-organisation.com"
                  />
                  {validationErrors.email && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Numéro de téléphone principal (optionnel)
                  </p>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="+33 1 23 45 67 89"
                  />
                  {validationErrors.phone && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Adresse physique de l'organisation (optionnel)
                  </p>
                  <textarea
                    value={createFormData.address}
                    onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Adresse complète de votre organisation"
                  />
                </div>

                {/* Preview Section */}
                {createFormData.name && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Eye size={20} className="text-green-600" />
                      <span>Aperçu de votre organisation</span>
                    </h4>
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl w-16 h-16 flex items-center justify-center text-white font-bold text-xl">
                        {createFormData.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 text-lg">{createFormData.name}</h5>
                        <p className="text-gray-600">{createFormData.email}</p>
                        {createFormData.phone && (
                          <p className="text-gray-600 text-sm">{createFormData.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  disabled={loading}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateOrganization}
                  disabled={!createFormData.name || !createFormData.email || loading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Plus size={20} />
                  )}
                  <span>{loading ? 'Création en cours...' : 'Créer l\'Organisation'}</span>
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Supprimer l'Organisation</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Confirmer la suppression</h4>
                  <p className="text-gray-600 text-sm">
                    Cette action est <strong>irréversible</strong> et supprimera définitivement toutes les données associées.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-800 text-sm">
                  Êtes-vous sûr de vouloir supprimer <strong>{currentOrganization?.name}</strong> ? 
                  Toutes les données (contacts, opportunités, tâches) seront définitivement perdues.
                </p>
              </div>

              <div className="text-xs text-gray-500 mb-6">
                <p>Cette action supprimera :</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Toutes les informations de l'organisation</li>
                  <li>Tous les contacts et opportunités</li>
                  <li>Toutes les tâches et rendez-vous</li>
                  <li>L'accès de tous les membres</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteOrganization}
                  disabled={loading}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  <span>{loading ? 'Suppression...' : 'Supprimer Définitivement'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;