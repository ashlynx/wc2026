#!/usr/bin/env python3
"""
fetch_wc2026.py
football-data.org (v4) から 2026 W杯の試合・順位を取得し、
原サイトと同じ形の wc2026-live.json を出力する。
cron で回して git push する運用を想定（origin_fetcher 系と同じ作法）。

必要: 環境変数 FOOTBALL_DATA_TOKEN（football-data.org の API トークン）
       pip install requests
注意: World Cup (competition code "WC") は football-data.org の
      プラン/シーズンによって提供範囲が異なる。無料枠で取れない場合は
      API-FOOTBALL 等へ parse 部分を差し替える（下の transform を置換）。
"""

import os, sys, json, datetime, pathlib
import requests

TOKEN = os.environ.get("FOOTBALL_DATA_TOKEN", "")
BASE  = "https://api.football-data.org/v4"
COMP  = "WC"                      # World Cup の competition code
OUT   = pathlib.Path(__file__).with_name("wc2026-live.json")
HEAD  = {"X-Auth-Token": TOKEN}

# 順位表は「結果が出たグループだけ」載せる原サイト挙動を再現（False で全グループ）
ONLY_STARTED_GROUPS = True


def get(path, params=None):
    r = requests.get(f"{BASE}{path}", headers=HEAD, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def transform_matches(raw):
    out = []
    for m in raw.get("matches", []):
        score = m.get("score", {}) or {}
        ft = score.get("fullTime", {}) or {}
        out.append({
            "matchId":  m.get("id"),
            "utcDate":  m.get("utcDate"),
            "status":   m.get("status"),                 # TIMED / IN_PLAY / FINISHED ...
            "stage":    m.get("stage"),                  # GROUP_STAGE / LAST_32 / ... / FINAL
            "group":    m.get("group"),                  # GROUP_A ... (KO は null)
            "homeTeam": (m.get("homeTeam") or {}).get("name"),
            "awayTeam": (m.get("awayTeam") or {}).get("name"),
            "homeScore": ft.get("home"),
            "awayScore": ft.get("away"),
            "winner":   score.get("winner"),             # HOME_TEAM / AWAY_TEAM / DRAW / null
        })
    return out


def transform_standings(raw):
    groups = []
    for g in raw.get("standings", []):
        # football-data は type=TOTAL/HOME/AWAY を返す。TOTAL のみ採用。
        if g.get("type") and g.get("type") != "TOTAL":
            continue
        table = []
        for row in g.get("table", []):
            table.append({
                "team":           (row.get("team") or {}).get("name"),
                "played":         row.get("playedGames"),
                "won":            row.get("won"),
                "drawn":          row.get("draw"),
                "lost":           row.get("lost"),
                "goalsFor":       row.get("goalsFor"),
                "goalsAgainst":   row.get("goalsAgainst"),
                "goalDifference": row.get("goalDifference"),
                "points":         row.get("points"),
            })
        if ONLY_STARTED_GROUPS and not any((t.get("played") or 0) > 0 for t in table):
            continue
        groups.append({"group": g.get("group"), "teams": table})
    return groups


def main():
    if not TOKEN:
        print("ERROR: FOOTBALL_DATA_TOKEN が未設定です。", file=sys.stderr)
        sys.exit(1)

    matches   = transform_matches(get(f"/competitions/{COMP}/matches"))
    standings = transform_standings(get(f"/competitions/{COMP}/standings"))

    ko_stages = {"LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"}
    knockout  = [
        {k: m[k] for k in
         ("matchId", "utcDate", "status", "stage",
          "homeTeam", "awayTeam", "homeScore", "awayScore", "winner")}
        for m in matches if m["stage"] in ko_stages
    ]

    payload = {
        "scores":      matches,
        "standings":   standings,
        "knockout":    knockout,
        "lastUpdated": datetime.datetime.now(datetime.timezone.utc)
                         .isoformat(timespec="milliseconds").replace("+00:00", "Z"),
    }

    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"OK wrote {OUT}  scores={len(matches)} standings_groups={len(standings)} ko={len(knockout)}")


if __name__ == "__main__":
    main()
