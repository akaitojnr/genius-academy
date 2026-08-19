"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Data = {
  signupsSeries: { date: string; count: number }[];
  completionsSeries: { date: string; count: number }[];
  attemptsSeries: { date: string; count: number }[];
  avgScoreSeries: { date: string; avgScore: number }[];
  revenueSeries: { date: string; revenue: number }[];
  popularSubjects: { name: string; enrollments: number }[];
};

export default function AnalyticsCharts({ data }: { data: Data }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {data.signupsSeries.length > 0 && (
        <ChartCard title="New Student Signups">
          <LineChart data={data.signupsSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>
      )}

      <ChartCard title="Lessons Completed">
        <LineChart data={data.completionsSeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartCard>

      <ChartCard title="CBT Attempts">
        <BarChart data={data.attemptsSeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Average CBT Score (%)">
        <LineChart data={data.avgScoreSeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="avgScore" stroke="#115e59" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartCard>

      {data.revenueSeries.length > 0 && (
        <ChartCard title="Revenue (₦)">
          <BarChart data={data.revenueSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      )}

      <ChartCard title="Most Popular Subjects (by enrollment)">
        <BarChart data={data.popularSubjects} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="enrollments" fill="#14b8a6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
