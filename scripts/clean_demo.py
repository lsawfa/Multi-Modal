import json
import os

NOTEBOOK_PATH = r"g:\Kegiatan\Project\Digital Forensic\BIMA\Multi Modal\notebooks\demo_multimodal.ipynb"

try:
    with open(NOTEBOOK_PATH, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    new_cells = []
    for cell in nb.get('cells', []):
        # Remove Next Steps cell
        if cell.get('cell_type') == 'markdown':
            source = "".join(cell.get('source', []))
            if "Next Steps" in source:
                continue # skip this cell
        
        # Replace BIMA in the source code
        if 'source' in cell:
            cell['source'] = [line.replace('BIMA Project', 'App Project').replace('BIMA', 'App') for line in cell['source']]
            
        # Replace BIMA in the outputs
        if 'outputs' in cell:
            for out in cell['outputs']:
                if 'text' in out:
                    out['text'] = [line.replace('BIMA', 'App') for line in out['text']]
                if 'data' in out and 'text/plain' in out['data']:
                    out['data']['text/plain'] = [line.replace('BIMA', 'App') for line in out['data']['text/plain']]
                    
        new_cells.append(cell)
        
    nb['cells'] = new_cells
    
    with open(NOTEBOOK_PATH, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)
        
    print("demo_multimodal.ipynb cleaned successfully!")
except Exception as e:
    print(f"Error cleaning demo notebook: {e}")
