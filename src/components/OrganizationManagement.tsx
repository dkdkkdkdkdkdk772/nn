import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  X, 
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  UserPlus,
  Crown,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { organizationService, CreateOrganizationData, UpdateOrganizationData } from '../services/organizationService';
import { authService } from '../services/authService';

const OrganizationManagement: React.FC = () => {
  const { t } = useLanguage();
  const { currentOrganization, loadUserOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [operationLoading, setOperationLoading] = useState({
    create: false,
    update: false,
    addUser: false,
  });

  const [createFormData, setCreateFormData] = useState<CreateOrganizationData>({
    name: '',
    email: '',
    address: '',
    phone: '',
  });

  const [editFormData, setEditFormData] = useState<UpdateOrganizationData>({
    name: '',
    email: '',
    address: '',
    phone: '',
  });

  const [addUserEmail, setAddUserEmail] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  // Load organization members
  useEffect(() => {
    if (currentOrganization) {
      loadMembers();
    }
  }, [currentOrganization]);

  const loadMembers = async () => {
    if (!currentOrganization) return;
    
    try {
      const membersData = await organizationService.getOrganizationMembers(currentOrganization.id);
      setMembers(membersData);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setSuccess(null);
    setTimeout(() => setError(null), 6000);
  };

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      email: '',
      address: '',
      phone: '',
    });
  };

  const resetEditForm = () => {
    if (currentOrganization) {
      setEditFormData({
        name: currentOrganization.name,
        email: currentOrganization.email || '',
        address: currentOrganization.address || '',
        phone: currentOrganization.phone || '',
      });
    }
  };

  const validateCreateForm = (): string | null => {
    if (!createFormData.name.trim()) {
      return 'Le nom de l\'organisation est obligatoire.';
    }
    if (!createFormData.email.trim()) {
      return 'L\'email est obligatoire.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email)) {
      return 'Format d\'email invalide.';
    }
    if (createFormData.name.trim().length < 2) {
      return 'Le nom doit contenir au moins 2 caractères.';
    }
    return null;
  };

  const validateEditForm = (): string | null => {
    if (!editFormData.name?.trim()) {
      return 'Le nom de l\'organisation est obligatoire.';
    }
    if (!editFormData.email?.trim()) {
      return 'L\'email est obligatoire.';
    }
    if (editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      return 'Format d\'email invalide.';
    }
    if (editFormData.name && editFormData.name.trim().length < 2) {
      return 'Le nom doit contenir au moins 2 caractères.';
    }
    return null;
  };

  const handleCreateOrganization = async () => {
    const validationError = validateCreateForm();
    if (validationError) {
      showErrorMessage(validationError);
      return;
    }

    try {
      setOperationLoading(prev => ({ ...prev, create: true }));
      setError(null);

      console.log('Creating organization with data:', createFormData);

      // Create the organization
      const newOrganization = await organizationService.createOrganization(createFormData);
      console.log('Organization created:', newOrganization);

      // The organizationService.createOrganization already calls joinOrganization internally
      // Now reload the user's organization data
      await loadUserOrganization();

      resetCreateForm();
      setShowCreateModal(false);
      showSuccessMessage('Organisation créée avec succès ! Vous en êtes maintenant membre. 🎉');
    } catch (err) {
      console.error('Failed to create organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Échec de la création de l\'organisation';
      showErrorMessage(errorMessage);
    } finally {
      setOperationLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleUpdateOrganization = async () => {
    if (!currentOrganization) return;

    const validationError = validateEditForm();
    if (validationError) {
      showErrorMessage(validationError);
      return;
    }

    try {
      setOperationLoading(prev => ({ ...prev, update: true }));
      setError(null);

      console.log('Updating organization with data:', editFormData);

      await organizationService.updateOrganization(currentOrganization.id, editFormData);
      
      // Reload organization data
      await loadUserOrganization();

      setShowEditModal(false);
      showSuccessMessage('Organisation mise à jour avec succès ! ✅');
    } catch (err) {
      console.error('Failed to update organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Échec de la mise à jour de l\'organisation';
      showErrorMessage(errorMessage);
    } finally {
      setOperationLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleAddUser = async () => {
    if (!currentOrganization || !addUserEmail.trim()) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addUserEmail)) {
      showErrorMessage('Format d\'email invalide.');
      return;
    }

    try {
      setOperationLoading(prev => ({ ...prev, addUser: true }));
      setError(null);

      console.log('Adding user to organization:', addUserEmail);

      await organizationService.addUserByEmail(currentOrganization.id, addUserEmail);
      
      // Reload members
      await loadMembers();

      setAddUserEmail('');
      setShowAddUserModal(false);
      showSuccessMessage('Utilisateur ajouté avec succès ! 👥');
    } catch (err) {
      console.error('Failed to add user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Échec de l\'ajout de l\'utilisateur';
      showErrorMessage(errorMessage);
    } finally {
      setOperationLoading(prev => ({ ...prev, addUser: false }));
    }
  };

  const openEditModal = () => {
    resetEditForm();
    setShowEditModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-yellow-500" />;
      case 'admin':
        return <Shield size={16} className="text-blue-500" />;
      case 'member':
        return <UserIcon size={16} className="text-green-500" />;
      default:
        return <UserIcon size={16} className="text-gray-500" />;
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
        return role;
    }
  };

  if (!currentOrganization) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gestion de l'Organisation</h3>
            <p className="text-sm text-gray-600">Créez ou rejoignez une organisation pour commencer</p>
          </div>
        </div>

        <div className="text-center py-12">
          <Building size={64} className="mx-auto text-gray-400 mb-6" />
          <h3 className="text-xl font-medium text-gray-900 mb-4">Aucune organisation</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Vous devez créer ou rejoindre une organisation pour accéder aux fonctionnalités de gestion.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                resetCreateForm();
                setShowCreateModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 justify-center"
            >
              <Plus size={20} />
              <span>Créer une Organisation</span>
            </button>
          </div>
        </div>

        {/* Create Organization Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Créer une Nouvelle Organisation</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={operationLoading.create}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'organisation *</label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Entrez le nom de votre organisation"
                    disabled={operationLoading.create}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@votre-organisation.com"
                    disabled={operationLoading.create}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={createFormData.address}
                    onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Adresse de l'organisation"
                    disabled={operationLoading.create}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Numéro de téléphone"
                    disabled={operationLoading.create}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={operationLoading.create}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateOrganization}
                  disabled={!createFormData.name || !createFormData.email || operationLoading.create}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {operationLoading.create ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Créer l'Organisation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2 animate-fade-in z-50">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-green-800">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 animate-fade-in z-50">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestion de l'Organisation</h3>
          <p className="text-sm text-gray-600">Gérez les informations et membres de votre organisation</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus size={20} />
            <span>Ajouter un Utilisateur</span>
          </button>
          <button
            onClick={openEditModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit size={20} />
            <span>Modifier</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2 animate-fade-in">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-800">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 animate-fade-in">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Organization Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl w-16 h-16 flex items-center justify-center text-white font-bold text-xl">
            {currentOrganization.avatar}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentOrganization.name}</h2>
            <p className="text-gray-600">Organisation #{currentOrganization.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{currentOrganization.email || 'Non renseigné'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone size={20} className="text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium text-gray-900">{currentOrganization.phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPin size={20} className="text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Adresse</p>
                <p className="font-medium text-gray-900">{currentOrganization.address || 'Non renseignée'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users size={20} className="text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Membres</p>
                <p className="font-medium text-gray-900">{members.length} membre(s)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Membres de l'Organisation</h3>
        
        {members.length === 0 ? (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Aucun membre trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-sm">
                    {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getRoleIcon(member.role || 'member')}
                  <span className="text-sm font-medium text-gray-700">
                    {getRoleLabel(member.role || 'member')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Organization Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Modifier l'Organisation</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={operationLoading.update}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'organisation *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez le nom de l'organisation"
                  disabled={operationLoading.update}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@organisation.com"
                  disabled={operationLoading.update}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Adresse de l'organisation"
                  disabled={operationLoading.update}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Numéro de téléphone"
                  disabled={operationLoading.update}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={operationLoading.update}
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateOrganization}
                disabled={!editFormData.name || !editFormData.email || operationLoading.update}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {operationLoading.update ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter un Utilisateur</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={operationLoading.addUser}
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email de l'utilisateur *</label>
              <input
                type="email"
                value={addUserEmail}
                onChange={(e) => setAddUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="utilisateur@email.com"
                disabled={operationLoading.addUser}
              />
              <p className="text-xs text-gray-500 mt-1">
                L'utilisateur doit déjà avoir un compte sur la plateforme.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={operationLoading.addUser}
              >
                Annuler
              </button>
              <button
                onClick={handleAddUser}
                disabled={!addUserEmail.trim() || operationLoading.addUser}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {operationLoading.addUser ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Ajout...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Ajouter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;