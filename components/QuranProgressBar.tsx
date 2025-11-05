import { computeRangeTierStats } from "@/services/SpacedRepetitionService";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface Props {
    firstWordId: number;
    lastWordId: number;
}

export default function QuranProgressBar({ firstWordId, lastWordId }: Props) {
    const [stats, setStats] = useState({
        notLearned: 0,
        weak: 0,
        fair: 0,
        good: 0,
        mastered: 0,
        total: 0,
    });

    useEffect(() => {
        fetchProgress();
    }, [firstWordId, lastWordId]);

    const fetchProgress = async () => {
        const result = await computeRangeTierStats(firstWordId, lastWordId);
        const tiers = result.tiers as Record<string, { count: number; percent: number }>;

        setStats({
            notLearned: tiers["0"]?.count ?? 0,
            weak: tiers["1"]?.count ?? 0,
            fair: tiers["2"]?.count ?? 0,
            good: tiers["3"]?.count ?? 0,
            mastered: tiers["4"]?.count ?? 0,
            total: result.total,
        });
    };

    const pct = (value: number) => stats.total ? (value / stats.total) * 100 : 0;

    return (
        <View style={{ width: "100%", padding: 12 }}>
            {/* <Text className="text-gray-800 dark:text-gray-200 font-bold mb-2">Progress</Text> */}

            <View style={{ flexDirection: "row", height: 18, width: "100%", borderRadius: 8, overflow: "hidden" }}>
                <View style={{ width: `${pct(stats.notLearned)}%`, backgroundColor: "#9ca3af" }} />
                <View style={{ width: `${pct(stats.weak)}%`, backgroundColor: "#dc2626" }} />
                <View style={{ width: `${pct(stats.fair)}%`, backgroundColor: "#facc15" }} />
                <View style={{ width: `${pct(stats.good)}%`, backgroundColor: "#3b82f6" }} />
                <View style={{ width: `${pct(stats.mastered)}%`, backgroundColor: "#16a34a" }} />
            </View>

            <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                <Text className="text-xs mr-4 mb-1" style={{ color: "#9ca3af" }}>Not Learned: {stats.notLearned} ({Math.round(pct(stats.notLearned))}%)</Text>
                <Text className="text-xs mr-4 mb-1" style={{ color: "#dc2626" }}>Weak: {stats.weak} ({Math.round(pct(stats.weak))}%)</Text>
                <Text className="text-xs mr-4 mb-1" style={{ color: "#facc15" }}>Fair: {stats.fair} ({Math.round(pct(stats.fair))}%)</Text>
                <Text className="text-xs mr-4 mb-1" style={{ color: "#3b82f6" }}>Good: {stats.good} ({Math.round(pct(stats.good))}%)</Text>
                <Text className="text-xs mr-4 mb-1" style={{ color: "#16a34a" }}>Mastered: {stats.mastered} ({Math.round(pct(stats.mastered))}%)</Text>
                <Text className="text-xs text-gray-600 dark:text-gray-300 font-bold mr-4 mb-1">Total: {stats.total}</Text>
            </View>
        </View>
    );
}