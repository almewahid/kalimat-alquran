import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function WeeklyChart({ data }) {
  return (
    <Card className="bg-card backdrop-blur-sm border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          النشاط الأسبوعي (نقاط الخبرة)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--foreground))' }} 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--foreground))' }} 
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--primary))' }}
                cursor={{ fill: 'rgba(var(--primary-rgb), 0.1)' }}
              />
              <Bar 
                dataKey="xp" 
                name="نقاط" 
                fill="rgb(var(--primary-rgb))" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}