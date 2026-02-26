import asyncio
import edge_tts
import base64
import sys
import json
import os
import torch
import numpy as np
import io
import soundfile as sf
from melo.api import TTS
from openvoice import se_extractor
from openvoice.api import ToneColorConverter

# Try to add static_ffmpeg to path if it exists
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except ImportError:
    pass

async def generate():
    if len(sys.argv) < 2:
        sys.stderr.write("Error: Missing segments JSON\n")
        sys.exit(1)
    
    try:
        segments = json.loads(sys.argv[1])
        combined_audio_buffer = io.BytesIO()
        all_audio_data = [] # List of (data, samplerate)
        
        # Load OpenVoice components only if needed
        tone_color_converter = None
        melo_tts = None
        ckpt_converter = 'checkpoints_v2/converter'
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        for segment in segments:
            text = segment.get("text", "")
            voice_id = segment.get("voice", "en-US-AvaMultilingualNeural")
            
            if not text:
                continue

            # Check if it's a cloned voice (id starts with user uuid or matches our pattern)
            # In our implementation, we pass the user_id as the voice_id for cloned voices
            se_path = os.path.join('cloned_voices', f"{voice_id}_se.pth")
            
            if os.path.exists(se_path):
                # USE OPENVOICE/MELO
                if tone_color_converter is None:
                    tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
                    tone_color_converter.load_checkpoint(f'{ckpt_converter}/checkpoint.pth')
                    # Use a default English model for MeloTTS
                    melo_tts = TTS(language='EN', device=device)
                    speaker_ids = melo_tts.hps.data.spk2id
                
                # 1. Generate with MeloTTS (base)
                # We use a neutral speaker from Melo as base
                speaker_id = speaker_ids['EN-Default']
                
                # Generate to temp path as OpenVoice expects file paths or we can handle in-memory
                # To keep it robust, let's use a temp wav file
                temp_melo_path = f"temp_melo_{voice_id}.wav"
                temp_output_path = f"temp_output_{voice_id}.wav"
                
                melo_tts.tts_to_file(text, speaker_id, temp_melo_path, speed=1.0)
                
                # 2. Extract source SE from generated audio
                source_se, _ = se_extractor.get_se(temp_melo_path, tone_color_converter, vad=True)
                
                # 3. Load target SE
                target_se = torch.load(se_path, map_location=device)
                
                # 4. Convert Tone Color
                tone_color_converter.convert(
                    model=melo_tts.model, 
                    src_se=source_se, 
                    tgt_se=target_se, 
                    audio_src_path=temp_melo_path, 
                    audio_save_path=temp_output_path
                )
                
                # Load converted audio
                data, samplerate = sf.read(temp_output_path)
                all_audio_data.append((data, samplerate))
                
                # Cleanup
                if os.path.exists(temp_melo_path): os.remove(temp_melo_path)
                if os.path.exists(temp_output_path): os.remove(temp_output_path)
                
            else:
                # USE EDGE TTS
                communicate = edge_tts.Communicate(text, voice_id)
                audio_data = b""
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_data += chunk["data"]
                
                # Load edge tts audio (MP3) into numpy array
                # Use io.BytesIO to read from memory
                data, samplerate = sf.read(io.BytesIO(audio_data))
                all_audio_data.append((data, samplerate))
        
        if all_audio_data:
            # Concatenate all audio. We might need to resample if samplerates differ.
            # Edge TTS is usually 24000, Melo is 44100 or 48000.
            # For simplicity, we'll resample all to 24000
            target_sr = 24000
            final_segments = []
            
            import librosa
            for data, sr in all_audio_data:
                if sr != target_sr:
                    data = librosa.resample(data, orig_sr=sr, target_sr=target_sr)
                final_segments.append(data)
            
            final_audio = np.concatenate(final_segments)
            
            # Save to buffer as MP3
            buffer = io.BytesIO()
            sf.write(buffer, final_audio, target_sr, format='WAV') # Output WAV for now, or use pydub for MP3
            # Actually, sf doesn't support MP3 writing easily. Let's use WAV and let Node.js handle it or change mime type
            
            print(base64.b64encode(buffer.getvalue()).decode('utf-8'))
        else:
            sys.stderr.write("Error: No audio data generated\n")
            sys.exit(1)
    except Exception as e:
        import traceback
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.stderr.write(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(generate())
