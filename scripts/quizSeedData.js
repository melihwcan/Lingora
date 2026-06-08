/**
 * Curated fill-in-the-blank quizzes. Auto-generated quizzes from vocabulary
 * are merged in seedCustomQuizzes.js; these manual entries take priority.
 */

/** Existing Donanım quizzes already in DB - preserved exactly. */
export const HARDWARE_EXISTING_QUIZZES = [
  {
    category: 'hardware',
    difficulty: 'beginner',
    question_text:
      'The main circuit board that connects all the components of a computer together is called the ___.',
    option_a: 'processor',
    option_b: 'motherboard',
    option_c: 'power supply',
    option_d: 'keyboard',
    correct_option: 'B',
  },
  {
    category: 'hardware',
    difficulty: 'intermediate',
    question_text:
      'Unlike traditional hard drives, an ___ has no moving mechanical parts, making data transfer significantly faster.',
    option_a: 'SSD',
    option_b: 'HDD',
    option_c: 'LCD',
    option_d: 'PSU',
    correct_option: 'A',
  },
  {
    category: 'hardware',
    difficulty: 'advanced',
    question_text:
      'To reduce the time it takes to access frequently used data from the main memory, the CPU utilizes extremely fast, on-chip ___ memory.',
    option_a: 'virtual',
    option_b: 'optical',
    option_c: 'flash',
    option_d: 'cache',
    correct_option: 'D',
  },
]

/** Extra curated hardware quizzes (4 per difficulty to reach 5 each). */
export const HARDWARE_EXTRA_QUIZZES = {
  beginner: [
    {
      question_text: 'My phone ___ is low.',
      option_a: 'battery',
      option_b: 'button',
      option_c: 'cable',
      option_d: 'charger',
      correct_option: 'A',
    },
    {
      question_text: 'This ___ feels comfortable to type on.',
      option_a: 'mouse',
      option_b: 'keyboard',
      option_c: 'speaker',
      option_d: 'screen',
      correct_option: 'B',
    },
    {
      question_text: 'I forgot my ___ at home.',
      option_a: 'router',
      option_b: 'printer',
      option_c: 'charger',
      option_d: 'monitor',
      correct_option: 'C',
    },
    {
      question_text: 'The ___ is cracked and needs repair.',
      option_a: 'battery',
      option_b: 'cable',
      option_c: 'screen',
      option_d: 'button',
      correct_option: 'C',
    },
  ],
  intermediate: [
    {
      question_text: 'A faster ___ speeds up everyday work on your PC.',
      option_a: 'processor',
      option_b: 'driver',
      option_c: 'BIOS',
      option_d: 'touchpad',
      correct_option: 'A',
    },
    {
      question_text: 'Games need a strong ___ for smooth graphics.',
      option_a: 'graphics card',
      option_b: 'power supply',
      option_c: 'SATA cable',
      option_d: 'optical drive',
      correct_option: 'A',
    },
    {
      question_text: '4K ___ shows sharper images on a large monitor.',
      option_a: 'refresh rate',
      option_b: 'resolution',
      option_c: 'form factor',
      option_d: 'pixel density',
      correct_option: 'B',
    },
    {
      question_text: 'Add more ___ to run heavy applications smoothly.',
      option_a: 'RAM',
      option_b: 'NVMe',
      option_c: 'BIOS',
      option_d: 'HDMI port',
      correct_option: 'A',
    },
  ],
  advanced: [
    {
      question_text: 'Low ___ matters in competitive online games.',
      option_a: 'throughput',
      option_b: 'latency',
      option_c: 'jitter',
      option_d: 'bandwidth',
      correct_option: 'B',
    },
    {
      question_text: 'Update the router ___ regularly for security patches.',
      option_a: 'chipset',
      option_b: 'firmware',
      option_c: 'capacitor',
      option_d: 'hypervisor',
      correct_option: 'B',
    },
    {
      question_text: 'Streaming video uses a lot of ___.',
      option_a: 'bandwidth',
      option_b: 'TDP',
      option_c: 'VRM',
      option_d: 'PCIe lane',
      correct_option: 'A',
    },
    {
      question_text: 'An old CPU can create a ___ for the GPU and limit frame rates.',
      option_a: 'chipset',
      option_b: 'bottleneck',
      option_c: 'hypervisor',
      option_d: 'failover',
      correct_option: 'B',
    },
  ],
}
