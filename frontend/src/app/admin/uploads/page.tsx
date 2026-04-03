import { redirect } from 'next/navigation'

export default function LegacyUploadsPage() {
  redirect('/admin/storage')
}
