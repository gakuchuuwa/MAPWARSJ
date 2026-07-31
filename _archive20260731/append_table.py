import os

table_path = r"C:\MAPWARSJ\S10QZ_Table.md"

with open(table_path, 'a', encoding='utf-8') as f:
    for i in range(59, 465, 8):
        row = '|'
        for j in range(i, min(i+8, 465)):
            row += f' {j} | <img src="file:///C:/MAPWARSJ/public/SUCAI/S10QZ/{j}-1.png" width="32"> |'
        # pad if less than 8
        for j in range(min(i+8, 465), i+8):
            row += '   |   |'
        f.write(row + '\n')
