def predict_delay_with_weather(data):
    # Mapping weather codes to risk factors
    # 0: Sunny, 1: Rain, 2: Storm, 3: Fog
    weather_risk = {0: 1.0, 1: 1.5, 2: 3.0, 3: 1.8}
    
    base_prob = model.predict_proba(features)[0][1]
    
    # Amplify risk based on weather
    weather_multiplier = weather_risk.get(data['weather'], 1.0)
    adjusted_prob = min(0.99, base_prob * weather_multiplier)
    
    return float(adjusted_prob)