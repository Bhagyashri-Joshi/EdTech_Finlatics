import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

import { api } from '../lib/api';

export default function Analytics() {

  const [
    days,
    setDays
  ] =
    useState(null);

  const [
    data,
    setData
  ] =
    useState(null);

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    error,
    setError
  ] =
    useState('');

  const requestRef =
    useRef(null);

  const load =
    async (selectedDays) => {

      requestRef.current?.abort();

      const controller =
        new AbortController();

      requestRef.current =
        controller;

      setLoading(true);
      setError('');

      try {

        const response =
          await api.get(
            '/analytics',
            {
              params: {
                days:
                  selectedDays
              },

              signal:
                controller.signal
            }
          );

        setData(response.data);

      } catch (err) {

        if (
          !controller.signal.aborted
        ) {

          setError(
            err.response?.data?.message ||
            'Could not load analytics.'
          );
        }

      } finally {

        if (
          requestRef.current ===
          controller
        ) {

          requestRef.current =
            null;

          setLoading(false);
        }
      }
    };

  useEffect(() => {

    let active = true;

    const loadDefault =
      async () => {

        try {

          const response =
            await api.get('/settings');

          const preferredDays =
            Number(
              response.data?.preferences
                ?.defaultAnalyticsDays
            );

          const validDays =
            [7, 30].includes(
              preferredDays
            )
              ? preferredDays
              : 30;

          if (active) {
            setDays(validDays);
          }

        } catch {

          if (active) {
            setDays(30);
          }

        }
      };

    loadDefault();

    return () => {
      active = false;
    };

  }, []);

  useEffect(() => {

    if (!days) {
      return;
    }

    load(days);

    return () =>
      requestRef.current?.abort();

  }, [days]);

  if (!days) {

    return (
      <div className="analytics-page">

        <div className="detail-grid two">

          <div className="skeleton detail-chart" />

          <div className="skeleton detail-chart" />

        </div>

      </div>
    );
  }

  return (

    <div className="analytics-page">

      <div className="page-intro">

        <div>

          <p className="eyebrow">
            ANALYTICS
          </p>

          <h1>
            Learning engagement trends
          </h1>

          <p>
            Real activity and performance data
            from your student cohort.
          </p>

        </div>

        <div className="time-filter">

          {[7, 30].map(
            (value) => (

              <button
                key={value}
                className={
                  days === value
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setDays(value)
                }
              >

                {value} Days

              </button>

            )
          )}

        </div>

      </div>

      {error && !data ? (

        <div className="state-card">

          <h2>
            Analytics unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            className="primary-btn"
            onClick={() =>
              load(days)
            }
          >
            Try again
          </button>

        </div>

      ) : !data && loading ? (

        <div className="detail-grid two">

          <div className="skeleton detail-chart" />

          <div className="skeleton detail-chart" />

        </div>

      ) : (

        <>

          <section className="retention-card panel">

            <div>

              <p className="eyebrow">

                {data.days}-DAY RETENTION

              </p>

              <strong>
                {data.retention.rate}%
              </strong>

              <p>

                {data.retention.returnedStudents}
                {' '}of{' '}
                {data.retention.cohortStudents}
                {' '}students in the original active cohort
                returned within{' '}
                {data.days}
                {' '}days.

              </p>

            </div>

            <div
              className="retention-ring"
              style={{
                '--retention':
                  `${data.retention.rate * 3.6}deg`
              }}
            >

              <span>
                {data.retention.rate}%
              </span>

            </div>

          </section>

          <div className="detail-grid two">

            <section className="panel chart-panel">

              <div className="section-head">

                <div>

                  <h2>
                    Engagement over time
                  </h2>

                  <p>
                    Average deterministic
                    engagement score
                  </p>

                </div>

              </div>

              {data.engagementOverTime.length ? (

                <div className="chart-box">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={
                        data.engagementOverTime
                      }
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          value.slice(5)
                        }
                        minTickGap={28}
                      />

                      <YAxis
                        domain={[0, 100]}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              ) : (

                <div className="empty-state">

                  <strong>
                    No engagement data
                  </strong>

                  <p>
                    There is no activity data
                    for this period yet.
                  </p>

                </div>

              )}

            </section>

            <section className="panel chart-panel">

              <div className="section-head">

                <div>

                  <h2>
                    Performance by topic
                  </h2>

                  <p>
                    Average student topic performance
                  </p>

                </div>

              </div>

              {data.topicPerformance.length ? (

                <div className="chart-box">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={
                        data.topicPerformance
                      }
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="topic"
                      />

                      <YAxis
                        domain={[0, 100]}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="score"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              ) : (

                <div className="empty-state">

                  <strong>
                    No topic performance
                  </strong>

                  <p>
                    No topic scores were recorded
                    for this period.
                  </p>

                </div>

              )}

            </section>

          </div>

        </>

      )}

    </div>
  );
}