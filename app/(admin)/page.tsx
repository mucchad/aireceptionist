// Admin root — redirect to /accounts
import { redirect } from 'next/navigation'

export default function AdminRoot() {
  redirect('/accounts')
}
