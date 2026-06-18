"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Heart, Activity, ArrowUpRight, ArrowDownRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getAdminStats(),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
         <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-red-500" />
         </div>
         <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
         <p className="text-slate-500">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
               <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
               <h1 className="text-2xl font-extrabold tracking-tight">Admin Dashboard</h1>
               <p className="text-sm text-slate-500 font-medium">Platform overview and management</p>
            </div>
         </div>
         <Button className="rounded-full font-bold shadow-md shadow-blue-500/10" asChild>
            <Link href="/admin/users">Manage Users</Link>
         </Button>
      </div>

      {isLoading ? (
         <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
               title="Total Users"
               value={stats?.users || 0}
               icon={Users}
               trend="+12%"
               isPositive={true}
            />
            <StatsCard
               title="Total Posts"
               value={stats?.posts || 0}
               icon={FileText}
               trend="+8%"
               isPositive={true}
            />
            <StatsCard
               title="Total Stories"
               value={stats?.stories || 0}
               icon={Heart}
               trend="-3%"
               isPositive={false}
            />
            <StatsCard
               title="Active Now"
               value={42}
               icon={Activity}
               trend="+24%"
               isPositive={true}
            />
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border-slate-100 shadow-sm">
            <CardHeader>
               <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                     <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div className="flex-1">
                           <p className="text-sm font-medium">New user registration: <span className="font-bold">user_{i}</span></p>
                           <p className="text-xs text-slate-400">2 hours ago</p>
                        </div>
                     </div>
                  ))}
               </div>
            </CardContent>
         </Card>

         <Card className="border-slate-100 shadow-sm">
            <CardHeader>
               <CardTitle className="text-lg font-bold">System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div>
                  <div className="flex justify-between text-sm mb-2">
                     <span className="font-medium text-slate-600">CPU Usage</span>
                     <span className="font-bold">12%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-green-500 w-[12%]" />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-2">
                     <span className="font-medium text-slate-600">Memory Usage</span>
                     <span className="font-bold">45%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[45%]" />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-2">
                     <span className="font-medium text-slate-600">Database Load</span>
                     <span className="font-bold">8%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-green-500 w-[8%]" />
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, isPositive }: any) {
   return (
      <Card className="border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
         <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-slate-50 group-hover:bg-blue-50 rounded-lg transition-colors">
                  <Icon size={20} className="text-slate-500 group-hover:text-blue-500" />
               </div>
               <div className={cn(
                  "flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full",
                  isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
               )}>
                  {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {trend}
               </div>
            </div>
            <div>
               <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
               <p className="text-3xl font-extrabold text-slate-900 mt-1">{value.toLocaleString()}</p>
            </div>
         </CardContent>
      </Card>
   );
}
