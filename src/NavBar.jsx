import { useLocation } from 'react-router-dom';

function beginAuth() {
  const state = generateRandomString(16);
  const verifier = generateRandomString(64);
  sessionStorage.setItem('pkce_state', state);
  sessionStorage.setItem('pkce_verifier', verifier);
  generateCodeChallenge(verifier).then(challenge => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });
    window.location = `${authorizeUrl}?${params.toString()}`;
  });
}

export default function NavBar({ navOpen, setNavOpen }) {
  const { pathname } = useLocation();
  const showLogin = pathname !== '/loggedin';

  {showLogin && (
    <button onClick={beginAuth} className="…">
      Login with Juno
    </button>
  )}
}