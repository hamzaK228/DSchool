import PortalHeader from "@/components/PortalHeader";
import PortalFooter from "@/components/PortalFooter";

export const dynamic = "force-dynamic";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between">
      <PortalHeader />
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
      <PortalFooter />
    </div>
  );
}