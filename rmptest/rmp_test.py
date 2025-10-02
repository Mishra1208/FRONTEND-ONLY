# rmp_test.py
import sys, base64, json, time, requests

HOME = "https://www.ratemyprofessors.com/"
HOSTS = [
    "https://www.ratemyprofessors.com/graphql",
    "https://rmp.ratemyprofessors.com/graphql",
]

SEARCH_QUERY = """
query TeacherSearch($query: String!, $schoolID: ID) {
  newSearch {
    teachers(query: $query, schoolID: $schoolID, first: 5) {
      edges {
        node {
          id
          legacyId
          firstName
          lastName
          school { id name legacyId }
          avgRating
          avgDifficulty
          numRatings
          wouldTakeAgainPercent
        }
      }
    }
  }
}
"""

BROWSER_HEADERS = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "origin": "https://www.ratemyprofessors.com",
    "referer": "https://www.ratemyprofessors.com/",
    "user-agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "rmp-client": "web",
    "x-requested-with": "XMLHttpRequest",
}

def to_relay_school_id(legacy_id: str | None) -> str | None:
    if not legacy_id:
        return None
    return base64.b64encode(f"School-{legacy_id}".encode()).decode()

def warm_session(sess: requests.Session):
    # Hit the homepage to receive CF cookies
    try:
        sess.get(HOME, timeout=15)
    except Exception:
        pass

def post_json(sess: requests.Session, url: str, payload: dict, timeout=15):
    r = sess.post(url, json=payload, timeout=timeout)
    # If not JSON, return snippet for diagnostics
    ctype = r.headers.get("content-type", "")
    if "application/json" not in ctype:
        return None, r.status_code, (r.text or "")[:500]
    try:
        return r.json(), r.status_code, None
    except Exception:
        return None, r.status_code, (r.text or "")[:500]

def find_prof(name: str, school_relay_id: str | None):
    payload = {"query": SEARCH_QUERY, "variables": {"query": name, "schoolID": school_relay_id}}
    sess = requests.Session()
    sess.headers.update(BROWSER_HEADERS)

    # pick up cookies once
    warm_session(sess)

    last_diag = None
    # try each host, with a short retry (Cloudflare sometimes on first hit)
    for host in HOSTS:
        for attempt in (1, 2):
            data, status, snippet = post_json(sess, host, payload)
            if isinstance(data, dict):
                edges = (
                    data.get("data", {})
                        .get("newSearch", {})
                        .get("teachers", {})
                        .get("edges", [])
                )
                return [e["node"] for e in edges if "node" in e]
            last_diag = (host, status, snippet)
            # brief backoff then retry once
            time.sleep(0.8)

    host, status, snippet = last_diag or ("<none>", 0, "")
    raise RuntimeError(
        "RMP didn’t return JSON. (Often a Cloudflare bot page.)\n"
        f"Last tried: {host}\n"
        f"HTTP status: {status}\n"
        "Response head (first 500 chars):\n"
        f"{snippet}"
    )

def summarize(t: dict) -> str:
    full = f'{t.get("firstName","")} {t.get("lastName","")}'.strip()
    school = t.get("school", {}).get("name", "Unknown school")
    wta = t.get("wouldTakeAgainPercent")
    wta_s = f"{wta}%" if wta is not None else "-"
    return (
        f"Professor: {full}\n"
        f"School: {school}\n"
        f"Avg Rating: {t.get('avgRating','-')}\n"
        f"Avg Difficulty: {t.get('avgDifficulty','-')}\n"
        f"Num Ratings: {t.get('numRatings','-')}\n"
        f"Would Take Again: {wta_s}\n"
        f"RMP Legacy ID: {t.get('legacyId','-')}"
    )

def main():
    if len(sys.argv) < 2:
        print("Usage: python rmp_test.py \"Professor Name\" [legacySchoolId]")
        print("Tip: Concordia’s legacy school id is 18443.")
        sys.exit(1)

    name = sys.argv[1]
    legacy_school = sys.argv[2] if len(sys.argv) > 2 else None
    relay_school = to_relay_school_id(legacy_school)

    try:
        profs = find_prof(name, relay_school)
    except Exception as e:
        print("Error calling RMP:\n", e)
        print("\nTry again in a few seconds, or run without VPN / different network.")
        sys.exit(2)

    if not profs:
        print("No matches.")
        return

    print("Top match:\n")
    print(summarize(profs[0]))
    if len(profs) > 1:
        print("\nOther matches:")
        for t in profs[1:]:
            print("—", f'{t.get("firstName","")} {t.get("lastName","")}', "@", t.get("school",{}).get("name","?"))

if __name__ == "__main__":
    main()
