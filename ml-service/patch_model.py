import h5py
import json

model_path = 'models/emotion_model.h5'
print(f"Opening {model_path} to deep-patch Keras 3 artifacts...")

def fix_keras3_formatting(obj):
    """Recursively searches for and fixes Keras 3 specific formatting."""
    if isinstance(obj, dict):
        # Fix DTypePolicy dictionaries by extracting just the string name
        if obj.get('class_name') == 'DTypePolicy' and 'config' in obj:
            return obj['config'].get('name', 'float32')
        
        # Recursively check all keys and values
        for key, value in list(obj.items()):
            obj[key] = fix_keras3_formatting(value)
            
        # Fix the batch_shape issue again just in case
        if 'batch_shape' in obj:
            obj['batch_input_shape'] = obj.pop('batch_shape')
            
    elif isinstance(obj, list):
        for i in range(len(obj)):
            obj[i] = fix_keras3_formatting(obj[i])
            
    return obj

try:
    with h5py.File(model_path, 'r+') as f:
        model_config_raw = f.attrs.get('model_config')
        if model_config_raw is None:
            print("Error: No model_config found in the .h5 file.")
        else:
            # Decode to string
            config_str = model_config_raw.decode('utf-8') if isinstance(model_config_raw, bytes) else model_config_raw
            
            # Parse string to JSON object
            config_json = json.loads(config_str)
            
            # Apply our deep fixes
            fixed_json = fix_keras3_formatting(config_json)
            
            # Convert back to string
            new_config_str = json.dumps(fixed_json)
            
            # Save it back into the .h5 file
            f.attrs['model_config'] = new_config_str.encode('utf-8') if isinstance(model_config_raw, bytes) else new_config_str
            print("Success! Model deeply patched for TensorFlow 2.15.0.")
            
except Exception as e:
    print(f"An error occurred: {e}")