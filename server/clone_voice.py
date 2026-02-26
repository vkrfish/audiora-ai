import os
import sys
import torch
import json
import base64
from openvoice import se_extractor
from melo.api import TTS

def clone_voice(reference_audio_path, output_dir, speaker_name):
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Check if output directory exists
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        # 1. Extract Speaker Embedding (SE)
        print(f"Extracting speaker embedding from {reference_audio_path}...")
        target_se, audio_name = se_extractor.get_se(reference_audio_path, se_extractor.toneread, vad=True)
        
        # 2. Save Speaker Embedding for later use
        se_path = os.path.join(output_dir, f"{speaker_name}_se.pth")
        torch.save(target_se, se_path)
        
        return {
            "status": "success",
            "speaker_name": speaker_name,
            "se_path": se_path,
            "message": "Voice cloned successfully locally."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"status": "error", "message": "Missing arguments"}))
        sys.exit(1)
        
    ref_path = sys.argv[1]
    out_dir = sys.argv[2]
    name = sys.argv[3]
    
    result = clone_voice(ref_path, out_dir, name)
    print(json.dumps(result))
