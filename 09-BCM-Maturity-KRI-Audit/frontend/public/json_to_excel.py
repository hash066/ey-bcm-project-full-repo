import json
import pandas as pd

def json_to_excel(json_file, excel_file):
    # Load JSON data from file
    with open(json_file, 'r') as f:
        data = json.load(f)

    # Extract nodes and edges
    nodes = data.get('nodes', [])
    edges = data.get('edges', [])

    # Convert lists to DataFrames
    nodes_df = pd.json_normalize(nodes)
    edges_df = pd.json_normalize(edges)

    # Create a Pandas Excel writer using XlsxWriter as the engine
    with pd.ExcelWriter(excel_file, engine='xlsxwriter') as writer:
        nodes_df.to_excel(writer, sheet_name='Nodes', index=False)
        edges_df.to_excel(writer, sheet_name='Edges', index=False)

    print(f"Data exported successfully to '{excel_file}'")

if __name__ == "__main__":
    json_to_excel('structure.json', 'structure.xlsx')
