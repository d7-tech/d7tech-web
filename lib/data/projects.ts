export interface Publication {
  authors: string;
  title: string;
  conference: string;
  doi: string;
  year: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  status: 'active' | 'completed' | 'in-development';
  tags: string[];
  description: string;
  category: 'autonomous-systems' | 'sensing' | 'ai-ml';
  /** Path under public/, e.g. /images/projects/wearable-sensors.jpg */
  coverImage: string;
  coverImageAlt: string;
  coverObjectFit?: 'cover' | 'contain';
  publications?: Publication[];
  youtubeEmbed?: string;
  startDate?: string;
}

export const projects: Project[] = [
  {
    id: 'prj-001',
    slug: 'wearable-sensors',
    title: 'Wearable Sensors & Performance Analysis',
    subtitle: 'UWB and IMU-based human motion tracking and performance analysis',
    status: 'completed',
    tags: ['UWB', 'IMU', 'Health', 'Sports', 'Localization'],
    category: 'sensing',
    coverImage: '/images/projects/wearable-sensors.jpg',
    coverImageAlt: 'Athlete training — motion and performance context for wearable sensing research',
    description:
      'Research into wearable sensor systems combining UWB (Ultra-Wideband) and IMU (Inertial Measurement Unit) technologies for precise human motion tracking, fall detection, and sports performance analysis. This project spans controlled lab environments and real-world field experiments.',
    publications: [
      {
        authors: 'K. A. Cinar, T. Soner Tekin, O. Dik, and A. Gunes',
        title: 'Fall Detection Using UWB Data',
        conference:
          '2025 33rd Signal Processing and Communications Applications Conference (SIU), Sile, Istanbul, Turkiye: IEEE, 2025, pp. 1–4.',
        doi: '10.1109/SIU66497.2025.11112503',
        year: 2025,
      },
    ],
  },
  {
    id: 'prj-002',
    slug: 'advisor',
    title: 'ADVISOR: Autonomous Surface Ship for Guidance',
    subtitle: 'EU ITEA Program — Escort-type Autonomous Surface Vehicle',
    status: 'active',
    tags: ['Reinforcement Learning', 'Sensor Fusion', 'EU ITEA', 'ASV', 'Navigation'],
    category: 'autonomous-systems',
    coverImage: '/images/projects/advisor.jpg',
    coverImageAlt: 'Surface vessel on open water — maritime autonomous systems',
    description:
      'ADVISOR is an escort-type Autonomous Surface Vehicle (ASV) developed under the EU ITEA program, focusing on autonomous guidance and cooperative navigation in constrained maritime environments including harbors and near-shore areas. The project emphasizes supervised autonomy, sensor fusion, and field validation.',
    startDate: 'January 2026',
  },
  {
    id: 'prj-003',
    slug: 'multistatic',
    title: 'Multi-Static Radar Systems',
    subtitle: 'Spatially distributed radar for multi-target tracking and spatial diversity',
    status: 'completed',
    tags: ['Sensor Fusion', 'Target Tracking', 'Radar', 'Signal Processing'],
    category: 'sensing',
    coverImage: '/images/projects/multistatic.jpg',
    coverImageAlt: 'RF and measurement hardware — multi-static radar and signal processing context',
    coverObjectFit: 'contain',
    description:
      'Multi-static radar research using separated transmitters and receivers to observe targets from multiple aspect angles. This approach improves detection robustness for low-RCS targets and reduces sensitivity to clutter, interference, and stealth shaping.',
    youtubeEmbed: 'https://www.youtube.com/embed/bU7NDo-aLyY?start=3',
    publications: [
      {
        authors: 'A. Gunes and G. Caliskan',
        title: 'A New Plot Fusion Approach for Multi-Static Multi-Target Tracking',
        conference:
          '2025 IEEE Radar Conference (RadarConf25), Krakow, Poland, Oct. 2025, pp. 728–733.',
        doi: '10.1109/RadarConf2559087.2025.11205024',
        year: 2025,
      },
    ],
  },
  {
    id: 'prj-004',
    slug: 'underwater-gliders',
    title: 'Autonomous Underwater Gliders',
    subtitle: 'Long-endurance autonomous platforms for underwater exploration and sensing',
    status: 'in-development',
    tags: ['Autonomous Vehicles', 'Underwater', 'Navigation', 'Sensing'],
    category: 'autonomous-systems',
    coverImage: '/images/projects/underwater-gliders.jpg',
    coverImageAlt: 'Underwater light rays in blue water — long-endurance subsea platforms',
    description:
      'Development of autonomous underwater glider platforms for long-endurance ocean monitoring, environmental data collection, and subsea sensing. Focuses on energy-efficient propulsion, navigation in dynamic underwater environments, and real-time data transmission.',
  },
  {
    id: 'prj-005',
    slug: 'warehouse-automation',
    title: 'Warehouse Automation & Order Picking',
    subtitle: 'Reinforcement learning and swarm optimization for multi-agent order picking',
    status: 'in-development',
    tags: ['Reinforcement Learning', 'PPO', 'DQN', 'Ant Colony Optimization', 'Path Planning'],
    category: 'ai-ml',
    coverImage: '/images/projects/warehouse-automation.jpg',
    coverImageAlt:
      'Algorithm selection interface showing ACO, RL and PPO options in the warehouse simulation platform',
    description:
      'Order picking optimization for steel warehouses, combining deep reinforcement learning agents with swarm-based path planning. Multiple picking vehicles are coordinated across a grid warehouse model to minimize total order completion time while avoiding collisions in shared aisles.',
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getProjectsByCategory(category: Project['category']): Project[] {
  return projects.filter((p) => p.category === category);
}
