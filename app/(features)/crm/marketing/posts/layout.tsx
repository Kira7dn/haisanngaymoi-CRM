export default async function PostLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="container mx-auto max-w-6xl p-2 sm:p-6">
      {children}
    </div>
  )
}
