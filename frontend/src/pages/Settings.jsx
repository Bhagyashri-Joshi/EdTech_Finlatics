import {
  useEffect,
  useState
} from 'react';

import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound
} from 'lucide-react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

function formatDate(value) {

  if (!value) {
    return 'Not available';
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  ).format(date);
}

export default function Settings() {

  const { user, updateUser } =
    useAuth();

  const [settings, setSettings] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [
    preferenceSaving,
    setPreferenceSaving
  ] =
    useState(false);

  const [
    profileMessage,
    setProfileMessage
  ] =
    useState('');

  const [
    passwordMessage,
    setPasswordMessage
  ] =
    useState('');

  const [
    preferenceMessage,
    setPreferenceMessage
  ] =
    useState('');

  const [
    profileError,
    setProfileError
  ] =
    useState('');

  const [
    passwordError,
    setPasswordError
  ] =
    useState('');

  const [
    preferenceError,
    setPreferenceError
  ] =
    useState('');

  const [
    showCurrentPassword,
    setShowCurrentPassword
  ] =
    useState(false);

  const [
    showNewPassword,
    setShowNewPassword
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword
  ] =
    useState(false);

  const [
    profileForm,
    setProfileForm
  ] =
    useState({
      name: '',
      email: ''
    });

  const [
    passwordForm,
    setPasswordForm
  ] =
    useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

  const [
    defaultAnalyticsDays,
    setDefaultAnalyticsDays
  ] =
    useState(30);

  const loadSettings =
    async () => {

      setLoading(true);
      setError('');

      try {

        const { data } =
          await api.get('/settings');

        setSettings(data);

        setProfileForm({
          name:
            data.profile?.name ||
            '',
          email:
            data.profile?.email ||
            ''
        });

        setDefaultAnalyticsDays(
          data.preferences
            ?.defaultAnalyticsDays ||
          30
        );

      } catch (err) {

        setError(
          err.response?.data?.message ||
          'Could not load settings.'
        );

      } finally {

        setLoading(false);
      }
    };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveProfile =
    async (event) => {

      event.preventDefault();

      setProfileSaving(true);
      setProfileError('');
      setProfileMessage('');

      try {

        const { data } =
          await api.put(
            '/settings/profile',
            profileForm
          );

        const updatedUser = {
          ...user,
          ...data.user
        };

        updateUser(updatedUser);

        setSettings((current) => ({
          ...current,
          profile: {
            ...current.profile,
            ...data.user
          }
        }));

        setProfileMessage(
          data.message ||
          'Profile updated successfully'
        );

      } catch (err) {

        setProfileError(
          err.response?.data?.message ||
          'Could not update profile.'
        );

      } finally {

        setProfileSaving(false);
      }
    };

  const savePassword =
    async (event) => {

      event.preventDefault();

      setPasswordSaving(true);
      setPasswordError('');
      setPasswordMessage('');

      try {

        const { data } =
          await api.put(
            '/settings/password',
            passwordForm
          );

        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        setPasswordMessage(
          data.message ||
          'Password changed successfully'
        );

      } catch (err) {

        setPasswordError(
          err.response?.data?.message ||
          'Could not change password.'
        );

      } finally {

        setPasswordSaving(false);
      }
    };

  const savePreferences =
    async () => {

      setPreferenceSaving(true);
      setPreferenceError('');
      setPreferenceMessage('');

      try {

        const { data } =
          await api.put(
            '/settings/preferences',
            {
              defaultAnalyticsDays
            }
          );

        setSettings((current) => ({
          ...current,
          preferences:
            data.preferences
        }));

        setPreferenceMessage(
          data.message ||
          'Preferences saved successfully'
        );

      } catch (err) {

        setPreferenceError(
          err.response?.data?.message ||
          'Could not save preferences.'
        );

      } finally {

        setPreferenceSaving(false);
      }
    };

  if (loading) {

    return (
      <div className="settings-page">

        <div className="skeleton settings-title-skeleton" />

        <div className="settings-grid">

          <div className="skeleton settings-card-skeleton" />

          <div className="skeleton settings-card-skeleton" />

          <div className="skeleton settings-card-skeleton" />

          <div className="skeleton settings-card-skeleton" />

        </div>

      </div>
    );
  }

  if (error) {

    return (
      <div className="settings-page">

        <div className="page-intro">

          <div>

            <p className="eyebrow">
              SETTINGS
            </p>

            <h1>
              Account settings
            </h1>

            <p>
              Manage your profile,
              security and application preferences.
            </p>

          </div>

        </div>

        <div className="state-card">

          <h2>
            Settings unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            className="primary-btn"
            onClick={loadSettings}
          >
            Try again
          </button>

        </div>

      </div>
    );
  }

  const aiConfigured =
    settings?.ai?.geminiConfigured;

  return (

    <div className="settings-page">

      {/* =============================================
          PAGE HEADER
      ============================================== */}

      <div className="page-intro">

        <div>

          <p className="eyebrow">
            SETTINGS
          </p>

          <h1>
            Account settings
          </h1>

          <p>
            Manage your profile,
            account security,
            AI configuration and application preferences.
          </p>

        </div>

      </div>

      <div className="settings-grid">

        {/* =============================================
            PROFILE
        ============================================== */}

        <section className="panel settings-card">

          <div className="settings-card-head">

            <div className="settings-icon">
              <UserRound size={19} />
            </div>

            <div>

              <h2>
                Profile settings
              </h2>

              <p>
                Update your account information.
              </p>

            </div>

          </div>

          <form
            className="settings-form"
            onSubmit={saveProfile}
          >

            <label>

              <span>
                Full name
              </span>

              <input
                type="text"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm(
                    (current) => ({
                      ...current,
                      name:
                        event.target.value
                    })
                  )
                }
                required
                maxLength={120}
              />

            </label>

            <label>

              <span>
                Email address
              </span>

              <input
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm(
                    (current) => ({
                      ...current,
                      email:
                        event.target.value
                    })
                  )
                }
                required
                maxLength={180}
              />

            </label>

            <div className="settings-readonly">

              <span>
                Account role
              </span>

              <strong>
                {settings?.profile?.role ||
                  'teacher'}
              </strong>

            </div>

            {profileError && (

              <div className="settings-message error">
                {profileError}
              </div>

            )}

            {profileMessage && (

              <div className="settings-message success">

                <Check size={15} />

                {profileMessage}

              </div>

            )}

            <button
              type="submit"
              className="primary-btn settings-save"
              disabled={profileSaving}
            >

              <Save size={16} />

              {profileSaving
                ? 'Saving...'
                : 'Save profile'}

            </button>

          </form>

        </section>

        {/* =============================================
            ACCOUNT SECURITY
        ============================================== */}

        <section className="panel settings-card">

          <div className="settings-card-head">

            <div className="settings-icon">
              <KeyRound size={19} />
            </div>

            <div>

              <h2>
                Account security
              </h2>

              <p>
                Change your password securely.
              </p>

            </div>

          </div>

          <form
            className="settings-form"
            onSubmit={savePassword}
          >

            <label>

              <span>
                Current password
              </span>

              <div className="password-input">

                <input
                  type={
                    showCurrentPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    passwordForm
                      .currentPassword
                  }
                  onChange={(event) =>
                    setPasswordForm(
                      (current) => ({
                        ...current,
                        currentPassword:
                          event.target.value
                      })
                    )
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showCurrentPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {showCurrentPassword
                    ? <EyeOff size={17} />
                    : <Eye size={17} />}

                </button>

              </div>

            </label>

            <label>

              <span>
                New password
              </span>

              <div className="password-input">

                <input
                  type={
                    showNewPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    passwordForm
                      .newPassword
                  }
                  onChange={(event) =>
                    setPasswordForm(
                      (current) => ({
                        ...current,
                        newPassword:
                          event.target.value
                      })
                    )
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showNewPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {showNewPassword
                    ? <EyeOff size={17} />
                    : <Eye size={17} />}

                </button>

              </div>

              <small>
                Minimum 8 characters.
              </small>

            </label>

            <label>

              <span>
                Confirm new password
              </span>

              <div className="password-input">

                <input
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    passwordForm
                      .confirmPassword
                  }
                  onChange={(event) =>
                    setPasswordForm(
                      (current) => ({
                        ...current,
                        confirmPassword:
                          event.target.value
                      })
                    )
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {showConfirmPassword
                    ? <EyeOff size={17} />
                    : <Eye size={17} />}

                </button>

              </div>

            </label>

            {passwordError && (

              <div className="settings-message error">
                {passwordError}
              </div>

            )}

            {passwordMessage && (

              <div className="settings-message success">

                <Check size={15} />

                {passwordMessage}

              </div>

            )}

            <button
              type="submit"
              className="primary-btn settings-save"
              disabled={passwordSaving}
            >

              <ShieldCheck size={16} />

              {passwordSaving
                ? 'Changing...'
                : 'Change password'}

            </button>

          </form>

        </section>

        {/* =============================================
            AI SETTINGS
        ============================================== */}

        <section className="panel settings-card">

          <div className="settings-card-head">

            <div className="settings-icon">
              <Sparkles size={19} />
            </div>

            <div>

              <h2>
                AI settings
              </h2>

              <p>
                Current AI Insights availability.
              </p>

            </div>

          </div>

          <div className="ai-settings-content">

            <div className="ai-status-row">

              <div>

                <span>
                  Gemini AI
                </span>

                <small>
                  {aiConfigured
                    ? 'Gemini API key is configured on the server.'
                    : 'Gemini API key is not configured on the server.'}
                </small>

              </div>

              <strong
                className={
                  aiConfigured
                    ? 'settings-status online'
                    : 'settings-status offline'
                }
              >
                {aiConfigured
                  ? 'Configured'
                  : 'Not configured'}
              </strong>

            </div>

            <div className="ai-status-row">

              <div>

                <span>
                  AI Insights
                </span>

                <small>
                  {aiConfigured
                    ? 'Student and dashboard insights are available.'
                    : 'Insights can use the existing fallback behavior until Gemini is configured.'}
                </small>

              </div>

              <strong
                className={
                  aiConfigured
                    ? 'settings-status online'
                    : 'settings-status offline'
                }
              >
                {aiConfigured
                  ? 'Available'
                  : 'Fallback mode'}
              </strong>

            </div>

            {!aiConfigured && (

              <div className="settings-info">

                Add a valid
                <code>
                  GEMINI_API_KEY
                </code>
                to the backend environment and restart the backend server.

              </div>

            )}

          </div>

        </section>

        {/* =============================================
            APPLICATION PREFERENCES
        ============================================== */}

        <section className="panel settings-card">

          <div className="settings-card-head">

            <div className="settings-icon">
              <Save size={19} />
            </div>

            <div>

              <h2>
                Application preferences
              </h2>

              <p>
                Choose the default analytics period.
              </p>

            </div>

          </div>

          <div className="settings-form">

            <div>

              <span className="settings-label">
                Default analytics period
              </span>

              <div className="analytics-options">

                {[7, 30].map((days) => (

                  <button
                    key={days}
                    type="button"
                    className={
                      defaultAnalyticsDays === days
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setDefaultAnalyticsDays(days)
                    }
                  >

                    <strong>
                      {days} Days
                    </strong>

                    <small>
                      Use as your default analytics view.
                    </small>

                  </button>

                ))}

              </div>

            </div>

            {preferenceError && (

              <div className="settings-message error">
                {preferenceError}
              </div>

            )}

            {preferenceMessage && (

              <div className="settings-message success">

                <Check size={15} />

                {preferenceMessage}

              </div>

            )}

            <button
              type="button"
              className="primary-btn settings-save"
              onClick={savePreferences}
              disabled={preferenceSaving}
            >

              <Save size={16} />

              {preferenceSaving
                ? 'Saving...'
                : 'Save preferences'}

            </button>

          </div>

        </section>

        {/* =============================================
            ACCOUNT INFORMATION
        ============================================== */}

        <section className="panel settings-card account-card">

          <div className="settings-card-head">

            <div className="settings-icon">
              <ShieldCheck size={19} />
            </div>

            <div>

              <h2>
                Account information
              </h2>

              <p>
                Your current account details.
              </p>

            </div>

          </div>

          <div className="account-information">

            <div>

              <span>
                Logged-in user
              </span>

              <strong>
                {settings?.profile?.name}
              </strong>

            </div>

            <div>

              <span>
                Email
              </span>

              <strong>
                {settings?.profile?.email}
              </strong>

            </div>

            <div>

              <span>
                Role
              </span>

              <strong>
                {settings?.account?.role}
              </strong>

            </div>

            <div>

              <span>
                Account created
              </span>

              <strong>
                {formatDate(
                  settings?.account?.createdAt
                )}
              </strong>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}