# ai_service/app.py
from flask import Flask, request, jsonify
from prophet import Prophet
import pandas as pd
import logging
import traceback
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "ok", "service": "project-prediction", "timestamp": datetime.now().isoformat()})

@app.route('/forecast', methods=['POST'])
def forecast():
    try:
        # Log incoming request
        logger.info(f"Received forecast request")

        # Get and validate input data
        data = request.json
        if not data or 'progressHistory' not in data:
            logger.warning("Missing progress history in request")
            return jsonify({
                'predictedCompletionDate': None,
                'message': 'Missing progress history data'
            }), 400

        history = data.get('progressHistory', [])

        # Check if we have enough data points
        if len(history) < 2:
            logger.info("Insufficient data points for prediction")
            return jsonify({
                'predictedCompletionDate': None,
                'message': 'Need at least 2 data points for prediction'
            }), 200

        # Create dataframe
        try:
            df = pd.DataFrame(history)
            df['ds'] = pd.to_datetime(df['date'])
            df['y'] = pd.to_numeric(df['progress'], errors='coerce')
        except Exception as e:
            logger.error(f"Error converting data to DataFrame: {str(e)}")
            return jsonify({
                'predictedCompletionDate': None,
                'message': 'Invalid data format'
            }), 400

        # Check for missing or invalid data
        if df['ds'].isnull().any() or df['y'].isnull().any():
            logger.warning("DataFrame contains null values")
            return jsonify({
                'predictedCompletionDate': None,
                'message': 'Data contains missing or invalid values'
            }), 400

        # Check if project is already at 100%
        if df['y'].max() >= 100:
            logger.info("Project already at 100% completion")
            latest_date = df['ds'].max()
            return jsonify({
                'predictedCompletionDate': latest_date.isoformat(),
                'message': 'Project already complete'
            }), 200

        # Check if progress is increasing
        is_increasing = (df.sort_values('ds')['y'].diff().dropna() >= 0).all()
        if not is_increasing:
            logger.warning("Project progress is not consistently increasing")
            # We'll still try to predict, but log the warning

        # Set up the model
        df['cap'] = 100  # Set cap for logistic growth

        try:
            # Fit Prophet model with logistic growth
            model = Prophet(growth='logistic')
            model.fit(df)

            # Create future dataframe - we'll look up to 1 year ahead
            future = model.make_future_dataframe(periods=365)
            future['cap'] = 100
            forecast = model.predict(future)

            # Find the first date where prediction hits 100%
            completion_forecast = forecast[forecast['yhat'] >= 99.5]  # Using 99.5 to account for small rounding errors

            if not completion_forecast.empty:
                completion_date = completion_forecast.iloc[0]['ds']

                # Sanity check - if prediction is more than 2 years in future, it's probably unreliable
                today = pd.Timestamp(datetime.now())
                two_years_from_now = today + pd.Timedelta(days=730)

                if completion_date > two_years_from_now:
                    logger.warning(f"Predicted completion date ({completion_date}) is very far in the future")
                    return jsonify({
                        'predictedCompletionDate': completion_date.isoformat(),
                        'message': 'Prediction is far in the future and may be unreliable'
                    }), 200

                logger.info(f"Successfully predicted completion date: {completion_date}")
                return jsonify({
                    'predictedCompletionDate': completion_date.isoformat()
                }), 200
            else:
                logger.info("Could not predict completion within the forecast period")
                return jsonify({
                    'predictedCompletionDate': None,
                    'message': 'Completion not predicted within forecast window'
                }), 200

        except Exception as modeling_error:
            logger.error(f"Prophet modeling error: {str(modeling_error)}")
            logger.error(traceback.format_exc())

            # Fallback to linear extrapolation
            try:
                logger.info("Attempting fallback to linear extrapolation")
                # Sort by date and get first and last points
                df_sorted = df.sort_values(by='ds')
                first_point = df_sorted.iloc[0]
                last_point = df_sorted.iloc[-1]

                # Calculate daily progress rate
                days_elapsed = (last_point['ds'] - first_point['ds']).total_seconds() / 86400
                if days_elapsed <= 0:
                    raise ValueError("Invalid date range")

                progress_rate = (last_point['y'] - first_point['y']) / days_elapsed
                if progress_rate <= 0:
                    raise ValueError("No progress being made")

                # Days until completion
                remaining_progress = 100 - last_point['y']
                days_to_completion = remaining_progress / progress_rate

                # Calculate completion date
                completion_date = last_point['ds'] + timedelta(days=days_to_completion)

                logger.info(f"Linear extrapolation predicts completion on: {completion_date}")
                return jsonify({
                    'predictedCompletionDate': completion_date.isoformat(),
                    'message': 'Prediction based on linear extrapolation (fallback method)'
                }), 200

            except Exception as fallback_error:
                logger.error(f"Fallback calculation failed: {str(fallback_error)}")
                return jsonify({
                    'predictedCompletionDate': None,
                    'message': 'Unable to calculate completion date'
                }), 200

    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'predictedCompletionDate': None,
            'message': 'Internal server error'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)