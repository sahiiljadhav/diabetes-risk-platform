import csv

INFILE = 'diabetes.csv'
OUTFILE = 'diabetes.csv'

with open(INFILE, 'r', newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

# Identify header index
header = rows[0]
if 'SkinThickness' in header:
    idx = header.index('SkinThickness')
    new_rows = []
    # Remove header column
    new_header = header[:idx] + header[idx+1:]
    new_rows.append(new_header)
    for row in rows[1:]:
        if len(row) > idx:
            new_row = row[:idx] + row[idx+1:]
        else:
            new_row = row
        new_rows.append(new_row)

    # Overwrite the same file with cleaned data
    with open(OUTFILE, 'w', newline='', encoding='utf-8') as out:
        writer = csv.writer(out)
        writer.writerows(new_rows)
    print(f"Removed 'SkinThickness' column and updated {OUTFILE}")
else:
    print("No 'SkinThickness' column found; no changes made.")
