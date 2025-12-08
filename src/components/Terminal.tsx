import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';

interface Command {
  input: string;
  output: string[];
}

interface HTMLIFrameElementWithFocus extends HTMLIFrameElement {
  focus(): void;
}

export default function Terminal() {
  const [history, setHistory] = useState<Command[]>([]);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [showCub3d, setShowCub3d] = useState(false);
  const [preloadCub3d, setPreloadCub3d] = useState(false);
  const [showMinishell, setShowMinishell] = useState(false);
  const [pendingLaunch, setPendingLaunch] = useState<'minishell' | 'cub3d' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElementWithFocus>(null);
  const minishellIframeRef = useRef<HTMLIFrameElementWithFocus>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 600);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    // Start preloading cub3d in background after 2 seconds
    const preloadTimer = setTimeout(() => {
      setPreloadCub3d(true);
    }, 2000);
    return () => clearTimeout(preloadTimer);
  }, []);

  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && showCub3d) {
        setShowCub3d(false);
      }
      if (e.key === 'Escape' && showMinishell) {
        setShowMinishell(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showCub3d, showMinishell]);

  useEffect(() => {
    if (showCub3d && iframeRef.current) {
      // Give the iframe time to load, then focus it
      const timer = setTimeout(() => {
        iframeRef.current?.focus();
        // Also try to focus the canvas inside the iframe
        try {
          iframeRef.current?.contentWindow?.focus();
        } catch (e) {
          console.log('Could not focus iframe content');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showCub3d]);

  useEffect(() => {
    if (showMinishell && minishellIframeRef.current) {
      // Give the iframe time to load, then focus it
      const timer = setTimeout(() => {
        minishellIframeRef.current?.focus();
        try {
          minishellIframeRef.current?.contentWindow?.focus();
        } catch (e) {
          console.log('Could not focus minishell iframe');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showMinishell]);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    const fullAsciiArt = [
      '______            _      _   _____     _                _    ',
      '|  _  \\          (_)    | | /  __ \\   (_)              | |   ',
      '| | | |__ _ _ __  _  ___| | | /  \\/___  _  ___ ___ __ _| | __',
      "| | | / _` | '_ \\| |/ _ \\ | | |   / __| |/ __/ __|/ _` | |/ /",
      '| |/ / (_| | | | | |  __/ | | \\__/\\__ \\ | (__\\__ \\ (_| |   < ',
      '|___/ \\__,_|_| |_|_|\\___|_|  \\____/___/_|\\___|___/\\__,_|_|\\_\\',
    ];

    const mobileAsciiArt = [
      '______            _      _ ',
      '|  _  \\          (_)    | |',
      '| | | |__ _ _ __  _  ___| |',
      "| | | / _` | '_ \\| |/ _ \\ |",
      '| |/ / (_| | | | | |  __/ |',
      '|___/ \\__,_|_| |_|_|\\___|_|',
      '',
      '   _____     _                _    ',
      '  /  __ \\   (_)              | |   ',
      '  | /  \\/___  _  ___ ___  __ _| | __',
      '  | |   / __| |/ __/ __|/ _` | |/ /',
      '  | \\__/\\__ \\ | (__\\__ \\ (_| |   < ',
      '   \\____/___/_|\\___|___/\\__,_|_|\\_\\',
    ];

    const welcomeCommand: Command = {
      input: '',
      output: [
        ...(isMobile ? mobileAsciiArt : fullAsciiArt),
        '',
        '',
        'Welcome to my portfolio!',
        'Type "help" for available commands.',
        '',
      ],
    };
    setHistory([welcomeCommand]);
  }, [isMobile]);

  const commands: { [key: string]: (arg?: string) => string[] } = {
    help: () => [
      'Available commands:',
      '  help                 - Show this help message',
      '  about                - Learn about me',
      '  skills               - View my technical skills',
      '  projects             - List all featured projects',
      '  projects <name>      - View a specific project',
      '  projects <name> --demo - Launch a project demo directly',
      '  contact              - Get my contact information',
      '  3d                   - View the 3D portfolio',
      '  clear                - Clear the terminal',
      '',
    ],

    about: () => [
      'About Me',
      '========',
      '',
      'I am a developer transitioning into software engineering and DevOps after a diverse professional background. I worked nearly 10 years at McDonald’s before moving into IT, and I now provide 1st and 2nd level support at SVC. My role includes supporting medical practices using GINO eCard readers, performing error analysis and remote troubleshooting, coordinating with technical partners, and handling IT workstation, printer, network, and software issues. I also manage documentation and tickets in Jira following ITIL standards.',
      '',
      'Academically, I studied mathematics and physics before shifting toward programming. I now study at 42 Vienna, a project-driven environment that emphasizes collaboration, autonomy, and practical problem-solving.',
      '',
      'Alongside work and school, I’m developing strong skills in DevOps, automation, and infrastructure. I work with Docker, Jenkins, CI/CD pipelines, and Linux systems, and I’m building a homelab to deepen my experience with real-world deployments.',
      '',
      'My goal is to become a versatile engineer capable of contributing across development, automation, and operations.',
    ],

    skills: () => [
      'Technical Skills',
      '===============',
      '',
      '**Programming:** C, C++, Bash, Python, SQL',
      '**DevOps & CI/CD:** Docker, Jenkins, containerized builds, automated deployments',
      '**Infrastructure & Systems:** Linux, server management, virtualization, homelab environments',
      '**IT Support:** 1st & 2nd level support, troubleshooting, user support, systems diagnostics',
      '**Web & Tools:** Vite, Three.js, static site deployment with Docker',
      '**Currently Learning:** Kubernetes, Ansible/Terraform, cloud technologies, low-level programming concepts',
    ],

    projects: (arg?: string) => {
      if (!arg)
        return [
          'Projects:',
          '=========',
          'minishell        - UNIX shell in C',
          'cub3d            - 3D raycaster',
          'Homelab          - Infrastructure automation setup',
          'Portfolio        - This terminal + 3D portfolio',
          'ft_irc           - IRC server (repo: cseriildi/ft_irc)',
          'ft_transcendence - Multiplayer Pong platform',
          '',
          'Use: projects <name> [--demo]',
          '',
        ];

      // Check for --demo flag
      const parts = arg.split(' ');
      const projectName = parts[0].toLowerCase();
      const hasDemo = parts.includes('--demo');

      const projectMap: any = {
        minishell: {
          info: [
            'minishell',
            '=========',
            'A full UNIX shell written in C.',
            'Features parsing, pipes, redirections, env vars, signals, logic operators.',
            'GitHub: https://github.com/Csicsi/minishell',
            '',
          ],
          hasDemo: true,
        },
        cub3d: {
          info: [
            'cub3d',
            '=====',
            'A Wolfenstein-style 3D raycaster game engine.',
            'Compiled to WebAssembly for browser play.',
            'GitHub: https://github.com/Csicsi/cub3d',
            '',
          ],
          hasDemo: true,
        },
        homelab: {
          info: [
            'Homelab',
            '=======',
            'My personal infrastructure setup with automation, services, and DevOps tooling.',
            'GitHub: https://github.com/Csicsi/Homelab',
            '',
          ],
          hasDemo: false,
        },
        portfolio: {
          info: [
            'Portfolio',
            '=========',
            'This interactive portfolio terminal + 3D version.',
            'GitHub: https://github.com/Csicsi/Portfolio',
            '',
          ],
          hasDemo: false,
        },
        ft_irc: {
          info: [
            'ft_irc',
            '======',
            'IRC server in C (collab repo).',
            'GitHub: https://github.com/cseriildi/ft_irc',
            '',
          ],
          hasDemo: false,
        },
        ft_transcendence: {
          info: [
            'ft_transcendence',
            '=================',
            'Full-stack multiplayer Pong with auth, chat, matchmaking.',
            'GitHub: https://github.com/cseriildi/ft_transcendence',
            '',
          ],
          hasDemo: false,
        },
      };

      const project = projectMap[projectName];

      if (!project) {
        return [`Project not found: ${projectName}`, ''];
      }

      // If --demo flag is present and project has demo
      if (hasDemo && project.hasDemo) {
        if (projectName === 'minishell') {
          setShowMinishell(true);
          return [...project.info, 'Launching minishell...', ''];
        } else if (projectName === 'cub3d') {
          if (!preloadCub3d) {
            setPreloadCub3d(true);
          }
          setShowCub3d(true);
          return [
            ...project.info,
            'Launching cub3D...',
            '',
            'Controls: WASD to move, Arrow keys to look, "e" to open doors',
            '',
          ];
        }
      }

      // If --demo flag but no demo available
      if (hasDemo && !project.hasDemo) {
        return [...project.info, 'No interactive demo available for this project.', ''];
      }

      // Regular info display - set pending launch if demo available
      if (project.hasDemo) {
        setPendingLaunch(projectName as 'minishell' | 'cub3d');
        return [...project.info, 'Launch demo? (y/n):'];
      }

      return project.info;
    },

    contact: () => [
      'Contact Information',
      '==================',
      'GitHub: https://github.com/Csicsi',
      'Email: your-email@example.com',
      '',
    ],

    '3d': () => {
      setTimeout(() => {
        window.location.href = '/old';
      }, 500);
      return ['Redirecting to 3D portfolio...', ''];
    },

    clear: () => [],
  };

  const executeCommand = (cmd: string) => {
    const parts = cmd.trim().split(' ');
    const base = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (!base) return;

    // Handle y/n responses for pending launches
    if (pendingLaunch) {
      const response = base.toLowerCase();
      if (response === 'y' || response === 'yes') {
        if (pendingLaunch === 'minishell') {
          setShowMinishell(true);
          setHistory([
            ...history,
            {
              input: cmd,
              output: [
                'Launching minishell...',
                '',
                'Interactive UNIX shell running in Docker sandbox',
                '',
              ],
            },
          ]);
        } else if (pendingLaunch === 'cub3d') {
          if (!preloadCub3d) {
            setPreloadCub3d(true);
          }
          setShowCub3d(true);
          setHistory([
            ...history,
            {
              input: cmd,
              output: [
                'Launching cub3D...',
                '',
                'Controls: WASD to move, Arrow keys to look, "e" to open doors',
                '',
              ],
            },
          ]);
        }
        setPendingLaunch(null);
        return;
      } else if (response === 'n' || response === 'no') {
        setHistory([
          ...history,
          {
            input: cmd,
            output: ['Launch cancelled.', ''],
          },
        ]);
        setPendingLaunch(null);
        return;
      } else {
        setHistory([
          ...history,
          {
            input: cmd,
            output: ['Please answer y or n', ''],
          },
        ]);
        return;
      }
    }

    if (base === 'clear') {
      setHistory([]);
      setPendingLaunch(null);
      return;
    }

    if (commands[base]) {
      const output = commands[base](arg || undefined);
      setHistory([...history, { input: cmd, output }]);
      return;
    }

    setHistory([
      ...history,
      {
        input: cmd,
        output: [`Command not found: ${cmd}`, 'Type "help" for available commands.', ''],
      },
    ]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && showCub3d) {
      setShowCub3d(false);
      return;
    }
    if (e.key === 'Escape' && showMinishell) {
      setShowMinishell(false);
      return;
    }

    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]?.input || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]?.input || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#00ff00',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '14px',
        padding: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        cursor: 'text',
      }}
    >
      <div
        ref={terminalRef}
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          textAlign: 'left',
        }}
      >
        {history.map((cmd, i) => (
          <div key={i}>
            {cmd.input && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#00ff00' }}>$ </span>
                <span style={{ color: '#ffffff' }}>{cmd.input}</span>
              </div>
            )}
            {cmd.output.map((line, j) => (
              <div
                key={j}
                style={{
                  marginLeft: '0px',
                  color: '#00ff00',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  maxWidth: '100%',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#00ff00', marginRight: '8px' }}>{pendingLaunch ? '' : '$'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              caretColor: '#00ff00',
            }}
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            fontSize: '11px',
            color: '#00ff0066',
          }}
        ></div>
      </div>

      {preloadCub3d && (
        <div
          onClick={() => setShowCub3d(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: showCub3d ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              // Focus iframe when clicking inside the container
              iframeRef.current?.focus();
              try {
                iframeRef.current?.contentWindow?.focus();
              } catch (err) {
                console.log('Could not focus iframe content');
              }
            }}
            style={{
              position: 'relative',
              width: '90%',
              height: '90%',
              maxWidth: '1200px',
              maxHeight: '800px',
              backgroundColor: '#000',
              border: '2px solid #00ff00',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setShowCub3d(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1001,
                backgroundColor: '#000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                padding: '8px 16px',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff00';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000';
                e.currentTarget.style.color = '#00ff00';
              }}
            >
              Close
            </button>
            <iframe
              ref={iframeRef}
              src="/cub3d/cub3d.html"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="cub3D Game"
              tabIndex={0}
            />
          </div>
        </div>
      )}

      {showMinishell && (
        <div
          onClick={() => setShowMinishell(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              // Focus iframe when clicking inside the container
              minishellIframeRef.current?.focus();
              try {
                minishellIframeRef.current?.contentWindow?.focus();
              } catch (err) {
                console.log('Could not focus minishell iframe');
              }
            }}
            style={{
              position: 'relative',
              width: '90%',
              height: '90%',
              maxWidth: '1200px',
              maxHeight: '800px',
              backgroundColor: '#000',
              border: '2px solid #00ff00',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setShowMinishell(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1001,
                backgroundColor: '#000',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                padding: '8px 16px',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff00';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000';
                e.currentTarget.style.color = '#00ff00';
              }}
            >
              Close
            </button>
            <iframe
              ref={minishellIframeRef}
              src="/minishell/public/index.html"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Minishell Terminal"
              tabIndex={0}
            />
          </div>
        </div>
      )}
    </div>
  );
}
