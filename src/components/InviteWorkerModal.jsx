import { useState } from 'react'
import { UserPlus, Copy, Check, X, Share2, MessageCircle, Smartphone } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { useAuth } from '../hooks/useAuth'
import { workersService } from '../services/workers.service'
import { toast } from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

export default function InviteWorkerModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState(null)
  const [copied, setCopied] = useState(false)

  const generateCode = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const code = await workersService.generateInviteCode(user.id)
      setInviteCode(code)
      toast.success('Invite code generated!')
    } catch (error) {
      toast.error(error.message || 'Failed to generate invite code')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const getInviteLink = () => {
    if (!inviteCode) return ''
    return `${window.location.origin}/signup?code=${inviteCode.code}`
  }

  const shareViaWhatsApp = () => {
    const link = getInviteLink()
    const message = `Join my business on StockGuard! Use this invite code: ${inviteCode.code}\n\nSign up here: ${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const shareViaSMS = () => {
    const link = getInviteLink()
    const message = `Join my business on StockGuard! Use invite code: ${inviteCode.code}. Sign up: ${link}`
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
  }

  const handleClose = () => {
    setInviteCode(null)
    setCopied(false)
    onClose()
  }

  const formatExpiryDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title="Invite Team Member">
      <div className="space-y-6">
        {/* Method 1: Generate Invite Code */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              Generate Invite Code
            </h3>
          </div>

          {!inviteCode ? (
            <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-gray-700 dark:text-slate-300 mb-4">
                Create a unique 6-character code that workers can use to join your business.
              </p>
              <Button onClick={generateCode} loading={loading} fullWidth>
                Generate Unique Code
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Code Display */}
              <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-2 border-dashed border-blue-300 dark:border-blue-600">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Invite Code</p>
                  <p className="text-4xl font-bold font-mono text-blue-600 dark:text-blue-400 mb-4 tracking-wider">
                    {inviteCode.code}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(inviteCode.code)}
                    leadingIcon={copied ? Check : Copy}
                    fullWidth
                  >
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <QRCodeSVG
                  value={getInviteLink()}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#3B82F6"
                  bgColor="transparent"
                />
              </div>

              {/* Expiry Warning */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  ⏰ Expires in 7 days ({formatExpiryDate(inviteCode.expires_at)})
                </p>
              </div>

              {/* Share Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Share via:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(getInviteLink())}
                    leadingIcon={Copy}
                    fullWidth
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={shareViaWhatsApp}
                    leadingIcon={MessageCircle}
                    fullWidth
                  >
                    WhatsApp
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={shareViaSMS}
                    leadingIcon={Smartphone}
                    fullWidth
                  >
                    SMS
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-50 mb-3">
            Instructions for Workers:
          </h4>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">1.</span>
              <span>Go to the signup page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">2.</span>
              <span>Select "Worker" tab</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">3.</span>
              <span>Enter the invite code: <strong>{inviteCode?.code || 'XXXXXX'}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">4.</span>
              <span>Complete registration with email and password</span>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

