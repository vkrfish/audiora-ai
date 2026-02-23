import asyncio
import edge_tts
import base64
import sys
import json

async def generate():
    if len(sys.argv) < 2:
        sys.stderr.write("Error: Missing segments JSON\n")
        sys.exit(1)
    
    try:
        segments = json.loads(sys.argv[1])
        combined_audio = b""
        
        for segment in segments:
            text = segment.get("text", "")
            voice = segment.get("voice", "en-US-AvaMultilingualNeural")
            
            if not text:
                continue
                
            communicate = edge_tts.Communicate(text, voice)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    combined_audio += chunk["data"]
        
        if combined_audio:
            # We output base64 to stdout so Node.js can easily read it
            print(base64.b64encode(combined_audio).decode('utf-8'))
        else:
            sys.stderr.write("Error: No audio data generated\n")
            sys.exit(1)
    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(generate())
