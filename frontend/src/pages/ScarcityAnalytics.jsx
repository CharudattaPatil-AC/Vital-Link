import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const ScarcityAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterState, setFilterState] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/bloodbanks/analytics/scarcity');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching scarcity analytics:', err);
      setError('Failed to fetch blood scarcity and deficit analytics.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Critical Deficit') {
      return <span className="badge bg-danger">CRITICAL DEFICIT</span>;
    } else if (status === 'Moderate Shortage') {
      return <span className="badge bg-warning text-dark">MODERATE SHORTAGE</span>;
    }
    return <span className="badge bg-success">ADEQUATE</span>;
  };

  const filteredStates = data?.states?.filter((st) => {
    const matchesName = st.state.toLowerCase().includes(filterState.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CRITICAL' && st.scarcityStatus === 'Critical Deficit') ||
      (statusFilter === 'MODERATE' && st.scarcityStatus === 'Moderate Shortage') ||
      (statusFilter === 'ADEQUATE' && st.scarcityStatus === 'Adequate');
    return matchesName && matchesStatus;
  }) || [];

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom gap-2">
        <div>
          <h2 className="fw-bold text-danger mb-1">
            📊 India Blood Scarcity & National Deficit Analytics
          </h2>
          <p className="text-muted mb-0">
            Real-time aggregate stock monitoring across all 2,439 official Indian blood banks to detect regional supply bottlenecks.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchAnalytics} disabled={loading}>
            🔄 Refresh Data
          </button>
          <Link to="/search/bloodbanks" className="btn btn-danger btn-sm fw-bold">
            🏥 Find Blood Banks
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-3 text-muted">Calculating national blood group reserves and scarcity quotients...</p>
        </div>
      ) : data ? (
        <>
          {/* National Metrics Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-sm-6">
              <div className="card shadow-sm border-0 border-start border-4 border-danger h-100">
                <div className="card-body">
                  <span className="text-muted small text-uppercase fw-bold">Verified Blood Banks</span>
                  <h3 className="fw-bold text-dark mt-1">{data.summary.totalBloodBanks.toLocaleString()}</h3>
                  <small className="text-success">Across {data.summary.statesCovered} States & UTs</small>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card shadow-sm border-0 border-start border-4 border-primary h-100">
                <div className="card-body">
                  <span className="text-muted small text-uppercase fw-bold">Total National Units</span>
                  <h3 className="fw-bold text-primary mt-1">{data.summary.totalUnitsInReserve.toLocaleString()}</h3>
                  <small className="text-muted">Live Reserve in Registry</small>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card shadow-sm border-0 border-start border-4 border-warning h-100">
                <div className="card-body">
                  <span className="text-muted small text-uppercase fw-bold">States in Deficit</span>
                  <h3 className="fw-bold text-warning mt-1">{data.summary.statesInCriticalDeficit}</h3>
                  <small className="text-danger">Rare Group Shortages</small>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card shadow-sm border-0 border-start border-4 border-danger h-100">
                <div className="card-body">
                  <span className="text-muted small text-uppercase fw-bold">Rare O- Reserve</span>
                  <h3 className="fw-bold text-danger mt-1">
                    {(data.summary.nationalGroups['O-'] || 0).toLocaleString()}
                  </h3>
                  <small className="text-muted">Universal Red Blood Cells</small>
                </div>
              </div>
            </div>
          </div>

          {/* National Blood Group Distribution Bar */}
          <div className="card shadow-sm border-0 mb-4 bg-light">
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">🩸 All-India Blood Group Availability Breakdown</h6>
              <div className="row g-2 text-center">
                {Object.entries(data.summary.nationalGroups).map(([bg, count]) => {
                  const isRare = ['O-', 'AB-', 'B-', 'A-'].includes(bg);
                  return (
                    <div key={bg} className="col-6 col-sm-3 col-md">
                      <div className={`p-2 rounded border bg-white ${isRare ? 'border-danger' : ''}`}>
                        <div className="fw-bold fs-6 text-danger">{bg}</div>
                        <div className="fw-bold fs-5 text-dark">{count.toLocaleString()}</div>
                        <small className="text-muted" style={{ fontSize: '11px' }}>
                          {isRare ? '⚠️ Rare Stock' : 'Active Stock'}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filters for State Table */}
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body py-2">
              <div className="row g-2 align-items-center">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search Indian State or UT (e.g. Maharashtra, Delhi, Karnataka)..."
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                  />
                </div>
                <div className="col-md-6 d-flex gap-1 justify-content-md-end">
                  <button
                    className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setStatusFilter('ALL')}
                  >
                    All States ({data.states.length})
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === 'CRITICAL' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setStatusFilter('CRITICAL')}
                  >
                    Critical Deficit
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === 'MODERATE' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                    onClick={() => setStatusFilter('MODERATE')}
                  >
                    Moderate
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === 'ADEQUATE' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setStatusFilter('ADEQUATE')}
                  >
                    Adequate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* State-by-State Scarcity Table */}
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-center">
                <thead className="table-dark text-nowrap">
                  <tr>
                    <th className="text-start ps-3">State / Union Territory</th>
                    <th>Blood Banks</th>
                    <th>Total Units</th>
                    <th>Scarcity Status</th>
                    <th>Critical Shortages</th>
                    <th className="text-danger">O-</th>
                    <th>O+</th>
                    <th className="text-danger">AB-</th>
                    <th>AB+</th>
                    <th className="text-danger">A-</th>
                    <th>A+</th>
                    <th className="text-danger">B-</th>
                    <th>B+</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStates.map((st) => (
                    <tr key={st.state}>
                      <td className="text-start ps-3 fw-bold text-dark">{st.state}</td>
                      <td>
                        <span className="badge bg-secondary">{st.totalBanks}</span>
                      </td>
                      <td className="fw-bold">{st.totalUnits.toLocaleString()}</td>
                      <td>{getStatusBadge(st.scarcityStatus)}</td>
                      <td>
                        {st.criticalGroups.length > 0 ? (
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            {st.criticalGroups.map((g) => (
                              <span key={g} className="badge bg-danger-subtle text-danger border border-danger">
                                Low {g}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted small">None</span>
                        )}
                      </td>
                      <td className="fw-bold text-danger">{st.bloodGroups['O-'] || 0}</td>
                      <td>{st.bloodGroups['O+'] || 0}</td>
                      <td className="fw-bold text-danger">{st.bloodGroups['AB-'] || 0}</td>
                      <td>{st.bloodGroups['AB+'] || 0}</td>
                      <td className="fw-bold text-danger">{st.bloodGroups['A-'] || 0}</td>
                      <td>{st.bloodGroups['A+'] || 0}</td>
                      <td className="fw-bold text-danger">{st.bloodGroups['B-'] || 0}</td>
                      <td>{st.bloodGroups['B+'] || 0}</td>
                      <td>
                        <Link
                          to={`/search/bloodbanks?search=${encodeURIComponent(st.state)}`}
                          className="btn btn-outline-danger btn-sm"
                        >
                          View Banks
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ScarcityAnalytics;
