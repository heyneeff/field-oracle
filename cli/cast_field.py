#!/usr/bin/env python3
# I Ching field reader — casts many independent hexagrams for one question
# and reports the aggregate "weather" instead of a single reading.
# Same three-coin mechanics / King Wen lookup as ~/.iching_log's single-cast tool,
# so a single cast and a field cast are the same coin, just sampled differently.

import random
import sys
import os
import json
import math
import argparse
import datetime
from collections import Counter

KING_WEN = [
    2,24, 7,19,15,36,46,11,  # upper=Kun  (000)
   16,51,40,54,62,55,32,34,  # upper=Zhen (001)
    8, 3,29,60,39,63,48, 5,  # upper=Kan  (010)
   45,17,47,58,31,49,28,43,  # upper=Dui  (011)
   23,27, 4,41,52,22,18,26,  # upper=Gen  (100)
   35,21,64,38,56,30,50,14,  # upper=Li   (101)
   20,42,59,61,53,37,57,44,  # upper=Xun  (110)
   12,25, 6,10,33,13, 9, 1,  # upper=Qian (111)
]

TRIGRAM_NAMES = {
    7: "Qian · Heaven", 3: "Dui · Lake", 5: "Li · Fire", 1: "Zhen · Thunder",
    6: "Xun · Wind", 2: "Kan · Water", 4: "Gen · Mountain", 0: "Kun · Earth",
}

LOG = os.path.expanduser("~/.iching_field_log")


def toss_line():
    return sum(random.choice([2, 3]) for _ in range(3))


def hexagram_number(lines):
    bits = sum((1 if v % 2 == 1 else 0) << i for i, v in enumerate(lines))
    return bits, KING_WEN[bits]


def transform(lines):
    return [7 if v == 6 else 8 if v == 9 else v for v in lines]


def entropy_ratio(counts, space_size):
    total = sum(counts.values())
    if total == 0:
        return 0.0
    h = 0.0
    for c in counts.values():
        p = c / total
        h -= p * math.log2(p)
    max_h = math.log2(space_size)
    return h / max_h if max_h > 0 else 0.0


def cast_field(n):
    hex_counts = Counter()
    transformed_counts = Counter()
    upper_counts = Counter()
    lower_counts = Counter()
    yang_balance = Counter()
    moving_count_dist = Counter()
    moving_hits = [0] * 6

    for _ in range(n):
        lines = [toss_line() for _ in range(6)]
        bits, primary = hexagram_number(lines)
        upper_counts[bits >> 3] += 1
        lower_counts[bits & 0b111] += 1
        hex_counts[primary] += 1
        yang_balance[sum(1 for v in lines if v % 2 == 1)] += 1

        moving = [i for i, v in enumerate(lines) if v in (6, 9)]
        moving_count_dist[len(moving)] += 1
        for i in moving:
            moving_hits[i] += 1

        if moving:
            _, changed = hexagram_number(transform(lines))
            transformed_counts[changed] += 1

    line_field = []
    for i in range(6):
        rate = moving_hits[i] / n
        line_field.append({
            "line": i + 1,
            "moving_rate": round(rate, 4),
            "deviation_from_baseline": round(rate - 0.25, 4),
        })
    line_field.sort(key=lambda r: abs(r["deviation_from_baseline"]), reverse=True)

    return {
        "n": n,
        "coherence": round(1 - entropy_ratio(hex_counts, 64), 4),  # 1=sharply focused field, 0=uniform noise
        "top_hexagrams": hex_counts.most_common(8),
        "top_transformed": transformed_counts.most_common(5),
        "upper_trigram_weather": sorted(
            ((TRIGRAM_NAMES[k], v) for k, v in upper_counts.items()),
            key=lambda kv: kv[1], reverse=True,
        ),
        "lower_trigram_weather": sorted(
            ((TRIGRAM_NAMES[k], v) for k, v in lower_counts.items()),
            key=lambda kv: kv[1], reverse=True,
        ),
        "yang_yin_balance": sorted(yang_balance.items()),  # key = count of yang lines 0-6, per cast
        "moving_line_count_dist": sorted(moving_count_dist.items()),
        "hot_lines": line_field,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("question", nargs="?", default="")
    parser.add_argument("--n", type=int, default=1000)
    args = parser.parse_args()

    question = args.question.strip() or input("Question: ").strip()
    result = cast_field(args.n)
    result["question"] = question

    print(json.dumps(result, indent=2))

    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    top = result["top_hexagrams"][0] if result["top_hexagrams"] else None
    summary = f"top={top[0]}x{top[1]}" if top else "no-data"
    with open(LOG, "a") as f:
        f.write(f"{ts}  [n={args.n} coherence={result['coherence']} {summary}]  {question}\n")


if __name__ == "__main__":
    main()
