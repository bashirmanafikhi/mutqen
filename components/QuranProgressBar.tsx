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
        <View style={{ width: "100%", padding: 2 }}>

            <View style={{ flexDirection: "row", height: 12, width: "100%", borderRadius: 8, overflow: "hidden" }}>
                <View style={{ width: `${pct(stats.notLearned)}%`, backgroundColor: "#9ca3af" }} />
                <View style={{ width: `${pct(stats.weak)}%`, backgroundColor: "#dc2626" }} />
                <View style={{ width: `${pct(stats.fair)}%`, backgroundColor: "#facc15" }} />
                <View style={{ width: `${pct(stats.good)}%`, backgroundColor: "#3b82f6" }} />
                <View style={{ width: `${pct(stats.mastered)}%`, backgroundColor: "#16a34a" }} />
            </View>

            <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                {stats.notLearned ? <Text className="text-xs mr-2" style={{ color: "#9ca3af" }}>غير متعلمة: {/*stats.notLearned*/} ({Math.round(pct(stats.notLearned))}%)</Text> : null}
                {stats.weak ? <Text className="text-xs mr-2" style={{ color: "#dc2626" }}>ضعيف: {/*stats.weak*/} ({Math.round(pct(stats.weak))}%)</Text> : null}
                {stats.fair ? <Text className="text-xs mr-2" style={{ color: "#facc15" }}>وسط: {/*stats.fair*/} ({Math.round(pct(stats.fair))}%)</Text> : null}
                {stats.good ? <Text className="text-xs mr-2" style={{ color: "#3b82f6" }}>جيد: {/*stats.good*/} ({Math.round(pct(stats.good))}%)</Text> : null}
                {stats.mastered ? <Text className="text-xs mr-2" style={{ color: "#16a34a" }}>متقن: {/*stats.mastered*/} ({Math.round(pct(stats.mastered))}%)</Text> : null}
                <Text className="text-xs text-gray-600 dark:text-gray-300 font-bold mr-2">عدد الكلمات: {stats.total}</Text>
            </View>
        </View>
    );
}