import pandas as pd

# File paths (relative to your project root)
courses = pd.read_csv("public/courses.csv")
course_desc = pd.read_csv("public/courseDesc.csv")

# Pad Course ID to 6 digits
course_desc["Course ID"] = course_desc["Course ID"].astype(str).str.zfill(6)
courses["course_id"] = courses["course_id"].astype(str).str.zfill(6)

# Merge
merged = courses.merge(course_desc, how="left", left_on="course_id", right_on="Course ID")

# Clean up
merged = merged.drop(columns=["Course ID"]).rename(columns={"Descr": "description"})

# Save merged file into the same folder
merged.to_csv("public/courses_merged.csv", index=False)

matched = merged["description"].notna().sum()
total = len(merged)
print(f"Descriptions matched: {matched}/{total}")

print("✅ Merged file saved as public/courses_merged.csv")
