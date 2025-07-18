import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { checkAdminAccess } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { userId } = await auth();
  const { locale } = await params;

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  // Check if user is authorized to access admin portal
  const { isAuthorized, user } = await checkAdminAccess();

  if (!isAuthorized) {
    redirect(`/${locale}/unauthorized`);
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-lg">
            <div className="p-4">
              <h1 className="text-2xl font-bold text-gray-800">803 Event</h1>
              <p className="text-sm text-gray-600">管理後台</p>
            </div>
            <AdminNav />
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
              <div className="px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    管理儀表板
                  </h2>
                  {user && (
                    <p className="text-sm text-gray-600">
                      歡迎, {user.name || user.email}
                      {user.is_super_admin && (
                        <span className="ml-2 text-blue-600 text-xs">
                          (超級管理員)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <UserButton />
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
