import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';

interface Command {
  input: string;
  output: string[];
}

export default function Terminal() {
  const [history, setHistory] = useState<Command[]>([]);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

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
  }, []);

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
      '| | | |__ _ _ __  _  ___| | | /  \\/___  _  ___ ___  __ _| | __',
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
          'Use: projects <name>',
          '',
        ];

      const p = arg.toLowerCase();
      const map: any = {
        minishell: [
          'minishell',
          '=========',
          'A full UNIX shell written in C.',
          'Features parsing, pipes, redirections, env vars, signals, logic operators.',
          'GitHub: https://github.com/Csicsi/minishell',
          '',
        ],
        cub3d: [
          'cub3d',
          '=====',
          'A Wolfenstein-style 3D raycaster game engine.',
          'GitHub: https://github.com/Csicsi/cub3d',
          '',
        ],
        homelab: [
          'Homelab',
          '=======',
          'My personal infrastructure setup with automation, services, and DevOps tooling.',
          'GitHub: https://github.com/Csicsi/Homelab',
          '',
        ],
        portfolio: [
          'Portfolio',
          '=========',
          'This interactive portfolio terminal + 3D version.',
          'GitHub: https://github.com/Csicsi/Portfolio',
          '',
        ],
        ft_irc: [
          'ft_irc',
          '======',
          'IRC server in C (collab repo).',
          'GitHub: https://github.com/cseriildi/ft_irc',
          '',
        ],
        ft_transcendence: [
          'ft_transcendence',
          '=================',
          'Full-stack multiplayer Pong with auth, chat, matchmaking.',
          'GitHub: https://github.com/cseriildi/ft_transcendence',
          '',
        ],
      };

      return map[p] || [`Project not found: ${arg}`, ''];
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

    if (base === 'clear') {
      setHistory([]);
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
          <span style={{ color: '#00ff00', marginRight: '8px' }}>$</span>
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
        >
          <Link to="/old" style={{ color: '#00ff0066', textDecoration: 'underline' }}>
            View 3D version
          </Link>
        </div>
      </div>
    </div>
  );
}
