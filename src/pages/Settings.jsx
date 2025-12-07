import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, Users, UserPlus, UserCog, X, Trash2, Lock } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import Switch from '../components/Switch'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import { authService } from '../services/auth.service'
import { toast } from 'react-hot-toast'

export default function Settings() {
  const { user, profile, loadProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Team management states
  const [teamMembers, setTeamMembers] = useState({ managers: [], workers: [] })
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState('manager')
  const [creating, setCreating] = useState(false)
  
  // New member form
  const [newMember, setNewMember] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  })
  const [memberErrors, setMemberErrors] = useState({})

  const [formData, setFormData] = useState({
    businessName: '',
    phoneNumber: '',
    email: '',
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.business_name || '',
        phoneNumber: profile.phone_number || '',
        email: profile.email || '',
      })
    }
  }, [profile])

  // Load team members for owners
  useEffect(() => {
    if (user && profile?.role === 'owner') {
      loadTeamMembers()
    }
  }, [user, profile])


  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          business_name: formData.businessName,
          phone_number: formData.phoneNumber,
          email: formData.email,
        })
        .eq('id', user.id)

      if (error) throw error

      // Refresh profile
      if (loadProfile) {
        await loadProfile(user.id)
      }

      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const validatePasswordChange = () => {
    const errors = {}

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required'
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters'
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password'
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChangePassword = async () => {
    if (!user) return

    if (!validatePasswordChange()) {
      return
    }

    setChangingPassword(true)
    try {
      // Call the database function to update password
      const { data, error } = await supabase.rpc('update_user_password', {
        p_user_id: user.id,
        p_old_password: passwordData.currentPassword,
        p_new_password: passwordData.newPassword,
      })

      if (error) {
        console.error('Password update error:', error)
        throw new Error(error.message || 'Failed to update password')
      }

      // Check if password was updated successfully
      if (data === false || data === null) {
        throw new Error('Current password is incorrect')
      }

      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordErrors({})
      setShowPasswordSection(false)

      toast.success('Password changed successfully!')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }


  // Team Management Functions
  const loadTeamMembers = async () => {
    if (!user) return
    
    setLoadingTeam(true)
    try {
      const [managersResult, workersResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'manager')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'worker')
          .order('created_at', { ascending: false }),
      ])

      if (managersResult.error) throw managersResult.error
      if (workersResult.error) throw workersResult.error

      setTeamMembers({
        managers: managersResult.data || [],
        workers: workersResult.data || [],
      })
    } catch (error) {
      console.error('Error loading team members:', error)
      toast.error('Failed to load team members')
    } finally {
      setLoadingTeam(false)
    }
  }

  const validateNewMember = () => {
    const errors = {}
    
    if (!newMember.username.trim()) {
      errors.username = 'Username is required'
    } else if (newMember.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(newMember.username.trim())) {
      errors.username = 'Username can only contain letters, numbers, and underscores'
    }
    
    if (!newMember.password) {
      errors.password = 'Password is required'
    } else if (newMember.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    
    if (newMember.password !== newMember.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (!newMember.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required'
    }
    
    setMemberErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateMember = async () => {
    if (!user || !validateNewMember()) return

    setCreating(true)
    try {
      const userData = {
        username: newMember.username.trim().toLowerCase(),
        password: newMember.password,
        role: selectedRole,
        business_name: null, // Business name not required for managers/workers
        phone_number: newMember.phoneNumber.trim(),
      }

      const { user: newUser, error } = await authService.signUp(userData, profile?.role)

      if (error) {
        throw new Error(error)
      }

      if (!newUser) {
        throw new Error('Failed to create user')
      }

      toast.success(`${selectedRole === 'manager' ? 'Manager' : 'Worker'} created successfully!`)
      
      // Reset form and close modal
      setNewMember({
        username: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
      })
      setMemberErrors({})
      setAddModalOpen(false)
      
      // Reload team members
      await loadTeamMembers()
      
      // If worker was created, trigger a refresh of the workers store
      // (Workers page will reload when user navigates to it)
      if (selectedRole === 'worker') {
        // Dispatch a custom event to notify Workers page to refresh
        window.dispatchEvent(new CustomEvent('workerCreated'))
      }
    } catch (error) {
      console.error('Error creating member:', error)
      let errorMessage = error.message || 'Failed to create user'
      
      if (errorMessage.includes('already exists') || errorMessage.includes('unique')) {
        errorMessage = 'This username is already taken. Please choose a different one.'
      } else if (errorMessage.includes('Maximum')) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const handleRemoveMember = async (memberId, role) => {
    if (!user) return
    
    if (!confirm(`Are you sure you want to remove this ${role}? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', memberId)
        .eq('role', role)

      if (error) throw error

      toast.success(`${role === 'manager' ? 'Manager' : 'Worker'} removed successfully`)
      await loadTeamMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error(`Failed to remove ${role}`)
    }
  }

  const openAddModal = (role) => {
    setSelectedRole(role)
    setNewMember({
      username: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      phoneNumber: '',
    })
    setMemberErrors({})
    setAddModalOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Settings</h1>
        </div>

        {/* Profile Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
            Profile Information
          </h2>
          <div className="space-y-4">
            <Input
              label="Business Name"
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Enter business name"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+256 XXX XXX XXX"
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                Change Password
              </h2>
            </div>
            {!showPasswordSection && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPasswordSection(true)}
              >
                Change Password
              </Button>
            )}
          </div>

          {showPasswordSection && (
            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
                error={passwordErrors.currentPassword}
              />

              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password (min. 8 characters)"
                error={passwordErrors.newPassword}
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
                error={passwordErrors.confirmPassword}
              />

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleChangePassword}
                  loading={changingPassword}
                  leadingIcon={Lock}
                >
                  Update Password
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordSection(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                    setPasswordErrors({})
                  }}
                  disabled={changingPassword}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>


        {/* Team Management - Only for Owners */}
        {profile?.role === 'owner' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                  Team Management
                </h2>
              </div>
            </div>

            {loadingTeam ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Managers Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                        Managers ({teamMembers.managers.length})
                      </h3>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openAddModal('manager')}
                      leadingIcon={UserPlus}
                    >
                      Add Manager
                    </Button>
                  </div>
                  {teamMembers.managers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400 py-4">
                      No managers yet. Click "Add Manager" to create one.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.managers.map((manager) => (
                        <div
                          key={manager.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {manager.business_name?.[0]?.toUpperCase() ||
                                  manager.username?.[0]?.toUpperCase() ||
                                  'M'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-50 truncate mb-1">
                                {manager.business_name || 'Manager'}
                              </p>
                              {manager.username && (
                                <p className="text-xs text-gray-600 dark:text-slate-400 truncate mb-1">
                                  @{manager.username}
                                </p>
                              )}
                              {manager.phone_number && (
                                <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                                  {manager.phone_number}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(manager.id, 'manager')}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                            title="Remove manager"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workers Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                        Workers ({teamMembers.workers.length})
                      </h3>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openAddModal('worker')}
                      leadingIcon={UserPlus}
                    >
                      Add Worker
                    </Button>
                  </div>
                  {teamMembers.workers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400 py-4">
                      No workers yet. Click "Add Worker" to create one.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.workers.map((worker) => (
                        <div
                          key={worker.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {worker.business_name?.[0]?.toUpperCase() ||
                                  worker.username?.[0]?.toUpperCase() ||
                                  'W'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-50 truncate mb-1">
                                {worker.business_name || 'Worker'}
                              </p>
                              {worker.username && (
                                <p className="text-xs text-gray-600 dark:text-slate-400 truncate mb-1">
                                  @{worker.username}
                                </p>
                              )}
                              {worker.phone_number && (
                                <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                                  {worker.phone_number}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(worker.id, 'worker')}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                            title="Remove worker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} leadingIcon={Save}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Add Team Member Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          setNewMember({
            username: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
          })
          setMemberErrors({})
        }}
        title={`Add New ${selectedRole === 'manager' ? 'Manager' : 'Worker'}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCreateMember()
          }}
          className="space-y-4"
        >
          <Input
            label="Username"
            type="text"
            value={newMember.username}
            onChange={(e) =>
              setNewMember({
                ...newMember,
                username: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
              })
            }
            error={memberErrors.username}
            placeholder="johndoe"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Role
            </label>
            <div className="input-field bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 cursor-not-allowed">
              {selectedRole === 'manager' ? 'Manager' : 'Worker'}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Role is determined by the button you clicked
            </p>
          </div>

          <Input
            label="Phone Number"
            type="tel"
            value={newMember.phoneNumber}
            onChange={(e) =>
              setNewMember({ ...newMember, phoneNumber: e.target.value })
            }
            error={memberErrors.phoneNumber}
            placeholder="+256 700 000 000"
            required
          />

          <Input
            label="Password"
            type="password"
            value={newMember.password}
            onChange={(e) =>
              setNewMember({ ...newMember, password: e.target.value })
            }
            error={memberErrors.password}
            placeholder="••••••••"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={newMember.confirmPassword}
            onChange={(e) =>
              setNewMember({ ...newMember, confirmPassword: e.target.value })
            }
            error={memberErrors.confirmPassword}
            placeholder="••••••••"
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setAddModalOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={creating}>
              Create {selectedRole === 'manager' ? 'Manager' : 'Worker'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

