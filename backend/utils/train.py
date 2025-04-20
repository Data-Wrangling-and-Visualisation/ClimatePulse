import pandas as pd
import numpy as np
import json
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline

def predict_metrics(n_years, json_data):
    df = pd.DataFrame(json_data)
    df['year'] = df['year'].astype(int)
    df = df.groupby(['metric', 'year'])['value'].mean().reset_index()
    df = df.sort_values(['metric', 'year'])

    predictions = {}
    for metric in df['metric'].unique():
        metric_data = df[df['metric'] == metric]

        X = metric_data[['year']]
        y = metric_data['value']

        model = make_pipeline(
            PolynomialFeatures(degree=2),
            LinearRegression()
        )
        model.fit(X, y)

        last_real_year = X['year'].max()
        future_years = np.arange(last_real_year + 1, last_real_year + 1 + n_years)
        future_X = pd.DataFrame({'year': future_years})
        future_pred = model.predict(future_X)

        if len(future_pred) > 0:
            adjusted_pred = future_pred - future_pred[0] + y.iloc[-1]
        else:
            adjusted_pred = np.array([])
        predictions[metric] = adjusted_pred.tolist()
    return predictions
