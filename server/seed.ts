
import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  const existingItems = await storage.getAllItems();
  if (existingItems.length > 0) {
    console.log('✅ Database already seeded, skipping...');
    return;
  }

  // Seed equipment categories (12 categories)
  const equipmentCategories = [
    { name: 'Cameras', image: '📷', subTypes: JSON.stringify(['Camera', 'Action Cam']), isEquipment: true },
    { name: 'Lenses', image: '🔍', subTypes: JSON.stringify(['Lenses', 'Digital Filter']), isEquipment: true },
    { name: 'Tripods & Stands', image: '🎥', subTypes: JSON.stringify(['Stands', 'Small Tripods', 'Backdrop Stands', 'Monopod']), isEquipment: true },
    { name: 'Grips & Stabilization', image: '✋', subTypes: JSON.stringify(['Crane', 'Gimbal', 'Dolly / Wheels Tripod', 'Shoulder Rig', 'Spider Rig', 'Slider', 'Camera Support Equipment', 'Rig & Stabilization Gear']), isEquipment: true },
    { name: 'Audio Equipment', image: '🎤', subTypes: JSON.stringify(['Microphone', 'Mic', 'Wireless Device', 'Recorder', 'Mixer', 'Boom Arm', 'Transmitter', 'Receiver']), isEquipment: true },
    { name: 'Lighting', image: '💡', subTypes: JSON.stringify(['LED Light', 'LED', 'Soft Box', 'Light', 'RGB Lights', 'LED Ring', 'Lighting Equipment']), isEquipment: true },
    { name: 'Studio Accessories', image: '🎭', subTypes: JSON.stringify(['Clapper', 'Reflector', 'Kit', 'Background Screen']), isEquipment: true },
    { name: 'Bags & Cases', image: '🎒', subTypes: JSON.stringify(['Bag', 'Backpacks', 'Bags & Cases']), isEquipment: true },
    { name: 'Batteries & Power', image: '🔋', subTypes: JSON.stringify(['V-Mount Battery', 'Battery', 'Charger', 'Inverter', 'Power Bank', 'Battery Power Tester', 'Power & Accessories']), isEquipment: true },
    { name: 'Cables & Adapters', image: '🔌', subTypes: JSON.stringify(['Cable', 'Socket', 'Extension']), isEquipment: true },
    { name: 'Monitors & Displays', image: '📺', subTypes: JSON.stringify(['Monitor', 'Screen', 'Computing & Display']), isEquipment: true },
    { name: 'Storage Devices', image: '💾', subTypes: JSON.stringify(['Storage Devices']), isEquipment: true },
  ];

  // Seed asset categories (7 categories)
  const assetCategories = [
    { name: 'Software Licenses', image: '💻', subTypes: JSON.stringify(['Editing Software', 'Design Software', 'Office Software']), isEquipment: false },
    { name: 'Office Supplies', image: '📎', subTypes: JSON.stringify(['Stationery', 'Desk Items', 'Printer Supplies']), isEquipment: false },
    { name: 'Pantry Items', image: '🥤', subTypes: JSON.stringify(['Snacks', 'Disposable Items']), isEquipment: false },
    { name: 'Transportation', image: '🚚', subTypes: JSON.stringify(['Vehicles', 'Delivery Equipment', 'Travel Accessories']), isEquipment: false },
    { name: 'Furniture', image: '🪑', subTypes: JSON.stringify(['Chairs', 'Tables', 'Storage Units']), isEquipment: false },
    { name: 'Communication Devices', image: '📱', subTypes: JSON.stringify(['SIM Cards', 'Internet Devices', 'Mobile Devices']), isEquipment: false },
    { name: 'Uniforms & Branding', image: '👕', subTypes: JSON.stringify(['Uniforms', 'Badges', 'Tags', 'T-Shirts', 'Tote Bags', 'Uniform Bags']), isEquipment: false },
  ];

  for (const category of [...equipmentCategories, ...assetCategories]) {
    await storage.createCategory(category);
    console.log(`  ✓ Created category: ${category.name}`);
  }

  const users = [
    {
      username: 'developer',
      password: await hashPassword('omg'),
      role: 'developer',
      email: 'developer@company.com',
      name: 'System Developer'
    },
    {
      username: 'admin',
      password: await hashPassword('omg'),
      role: 'admin',
      email: 'omg.inventorysystem@gmail.com',
      name: 'System Administrator'
    },
    {
      username: 'staff1',
      password: await hashPassword('omg'),
      role: 'user',
      email: 'staff1@company.com',
      name: 'Staff Member 1'
    },
    {
      username: 'staff2',
      password: await hashPassword('omg'),
      role: 'user',
      email: 'staff2@company.com',
      name: 'Staff Member 2'
    }
  ];

  for (const user of users) {
    await storage.createUser(user);
    console.log(`  ✓ Created user: ${user.username}`);
  }

  const items = [
    // 1. Cameras
    { barcode: 'CAM-001', productName: 'GH4 Lumix Cameras', productType: 'Camera', status: 'Available', location: 'Studio A', notes: 'Panasonic Lumix GH4', isEquipment: true },
    { barcode: 'CAM-002', productName: 'Canon 70D Camera', productType: 'Camera', status: 'Available', location: 'Studio A', notes: 'Canon DSLR Camera', isEquipment: true },
    { barcode: 'ACAM-001', productName: 'Insta 360 One R Lens Action Cam', productType: 'Action Cam', status: 'Available', location: 'Equipment Room', notes: '360 degree action camera', isEquipment: true },

    // 2. Lenses
    { barcode: 'LENS-001', productName: 'CANON 50MM', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'Prime lens', isEquipment: true },
    { barcode: 'LENS-002', productName: 'CANON 18-55', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'Kit lens', isEquipment: true },
    { barcode: 'LENS-003', productName: 'CANON 85MM', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'Portrait lens', isEquipment: true },
    { barcode: 'LENS-004', productName: 'CANON 18-135MM', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'Zoom lens', isEquipment: true },
    { barcode: 'LENS-005', productName: 'CANON SIGMA DC 18-200MM', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'All-purpose zoom', isEquipment: true },
    { barcode: 'LENS-006', productName: 'LUMIX 20MM', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'Pancake lens', isEquipment: true },
    { barcode: 'LENS-007', productName: 'LUMIX 15MM', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'Wide angle', isEquipment: true },
    { barcode: 'LENS-008', productName: 'LUMIX 14-140MM HD', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'HD zoom lens', isEquipment: true },
    { barcode: 'LENS-009', productName: 'LUMIX 35-100MM', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'Telephoto zoom', isEquipment: true },
    { barcode: 'LENS-010', productName: 'LUMIX G12-35MM', productType: 'Lenses', status: 'Available', location: 'Lens Cabinet', notes: 'Standard zoom', isEquipment: true },
    { barcode: 'FILT-001', productName: 'Digital Filter', productType: 'Digital Filter', status: 'Available', location: 'Accessories Drawer', notes: 'Digital lens filter', isEquipment: true },

    // 3. Tripods & Stands
    { barcode: 'STND-001', productName: 'LED Soft Box Stands (Average)', productType: 'Stands', status: 'Available', location: 'Stand Storage', notes: 'Medium height stands', isEquipment: true },
    { barcode: 'STND-002', productName: 'CAER AF2434 (H4)', productType: 'Stands', status: 'Available', location: 'Stand Storage', notes: 'Heavy duty stand', isEquipment: true },
    { barcode: 'STND-003', productName: 'Manfrotto 190 (Video Head Separate)', productType: 'Stands', status: 'Available', location: 'Stand Storage', notes: 'Professional tripod', isEquipment: true },
    { barcode: 'STND-004', productName: 'Soft Box Large Stand', productType: 'Stands', status: 'Available', location: 'Stand Storage', notes: 'Tall stand for softbox', isEquipment: true },
    { barcode: 'STND-005', productName: 'Sea Stands', productType: 'Stands', status: 'Available', location: 'Stand Storage', notes: 'Light stands', isEquipment: true },
    { barcode: 'STND-006', productName: 'Small Tripod', productType: 'Small Tripods', status: 'Available', location: 'Equipment Room', notes: 'Compact tripod', isEquipment: true },
    { barcode: 'STND-007', productName: 'Backdrop Stand (Large)', productType: 'Backdrop Stands', status: 'Available', location: 'Studio B', notes: 'Large backdrop support', isEquipment: true },
    { barcode: 'MONO-001', productName: 'CAER CF34DV with Head', productType: 'Monopod', status: 'Available', location: 'Equipment Room', notes: 'Professional monopod', isEquipment: true },

    // 4. Grips
    { barcode: 'CRANE-001', productName: 'iFootage Minicrane M1-111', productType: 'Crane', status: 'Available', location: 'Equipment Storage', notes: 'Camera crane', isEquipment: true },
    { barcode: 'GIBL-001', productName: 'Crane 3 S-Pro Gimbal', productType: 'Gimbal', status: 'Available', location: 'Studio A', notes: 'Professional gimbal', isEquipment: true },
    { barcode: 'GIBL-002', productName: 'DJI Ronin SC Gimbal', productType: 'Gimbal', status: 'Available', location: 'Studio A', notes: 'Compact gimbal', isEquipment: true },
    { barcode: 'DOLLY-001', productName: 'Dolly (Wheels Tripod)', productType: 'Dolly / Wheels Tripod', status: 'Available', location: 'Equipment Storage', notes: 'Camera dolly', isEquipment: true },
    { barcode: 'DOLLY-002', productName: 'Dolly (Small Tripod Wheels)', productType: 'Dolly / Wheels Tripod', status: 'Available', location: 'Equipment Storage', notes: 'Small dolly', isEquipment: true },
    { barcode: 'SRIG-001', productName: 'Shoulder Rig Kit Film City MB600', productType: 'Shoulder Rig', status: 'Available', location: 'Equipment Room', notes: 'Professional shoulder rig', isEquipment: true },
    { barcode: 'SRIG-002', productName: 'Neewer Shoulder Rig', productType: 'Shoulder Rig', status: 'Available', location: 'Equipment Room', notes: 'Budget shoulder rig', isEquipment: true },
    { barcode: 'SRIG-003', productName: 'Local Shoulder Rig', productType: 'Shoulder Rig', status: 'Available', location: 'Equipment Room', notes: 'Custom shoulder rig', isEquipment: true },
    { barcode: 'SPRIG-001', productName: 'Spider Rig', productType: 'Spider Rig', status: 'Available', location: 'Equipment Storage', notes: 'Spider camera rig', isEquipment: true },
    { barcode: 'SLID-001', productName: 'Electronic Slider Edelkrone', productType: 'Slider', status: 'Available', location: 'Studio A', notes: 'Motorized slider', isEquipment: true },
    { barcode: 'SLID-002', productName: 'Neewer Slider (Head)', productType: 'Slider', status: 'Available', location: 'Studio A', notes: 'Manual slider with head', isEquipment: true },
    { barcode: 'SLID-003', productName: 'Benro Slider MU005583', productType: 'Slider', status: 'Available', location: 'Studio A', notes: 'Carbon fiber slider', isEquipment: true },
    { barcode: 'SLID-004', productName: 'Small Slider Neewer', productType: 'Slider', status: 'Available', location: 'Equipment Room', notes: 'Compact slider', isEquipment: true },
    { barcode: 'CSUP-001', productName: 'Manfrotto 290 XTRA Tripod', productType: 'Camera Support Equipment', status: 'Available', location: 'Stand Storage', notes: 'Professional tripod', isEquipment: true },
    { barcode: 'CSUP-002', productName: 'Manfrotto 190 Go Tripod', productType: 'Camera Support Equipment', status: 'Available', location: 'Stand Storage', notes: 'Travel tripod', isEquipment: true },
    { barcode: 'CSUP-003', productName: 'Yunteng 288 Tripod', productType: 'Camera Support Equipment', status: 'Available', location: 'Stand Storage', notes: 'Budget tripod', isEquipment: true },
    { barcode: 'CSUP-004', productName: 'Benro Tripod with Head', productType: 'Camera Support Equipment', status: 'Available', location: 'Stand Storage', notes: 'Tripod with fluid head', isEquipment: true },
    { barcode: 'RIG-001', productName: 'Froza 60C', productType: 'Rig', status: 'Available', location: 'Equipment Room', notes: 'Camera rig accessory', isEquipment: true },
    { barcode: 'RIG-002', productName: 'Godex 60C', productType: 'Rig', status: 'Available', location: 'Equipment Room', notes: 'Camera rig accessory', isEquipment: true },
    { barcode: 'RIG-003', productName: 'Crane 3 S-Pro', productType: 'Rig & Stabilization Gear', status: 'Available', location: 'Equipment Room', notes: 'Stabilization rig', isEquipment: true },

    // 5. Audio
    { barcode: 'MIC-001', productName: 'Rode Mic', productType: 'Microphone', status: 'Available', location: 'Audio Room', notes: 'Professional microphone', isEquipment: true },
    { barcode: 'MIC-002', productName: 'Dodex VD-Mic', productType: 'Microphone', status: 'Available', location: 'Audio Room', notes: 'On-camera mic', isEquipment: true },
    { barcode: 'MIC-003', productName: 'Podcast Mic Blue', productType: 'Microphone', status: 'Available', location: 'Podcast Room', notes: 'USB podcast microphone', isEquipment: true },
    { barcode: 'MIC-004', productName: 'Neewer NW-700 Mic', productType: 'Microphone', status: 'Available', location: 'Audio Room', notes: 'Condenser microphone', isEquipment: true },
    { barcode: 'MIC-005', productName: 'LVI Lavalier Micro-Cravate MOVO', productType: 'Mic', status: 'Available', location: 'Audio Room', notes: 'Lavalier microphone', isEquipment: true },
    { barcode: 'MIC-006', productName: 'MOVO Wire-Mike Doll', productType: 'Mic', status: 'Available', location: 'Audio Room', notes: 'Wired lavalier', isEquipment: true },
    { barcode: 'WMIC-001', productName: 'Wireless Go II (Rode)', productType: 'Wireless Device', status: 'Available', location: 'Audio Room', notes: 'Wireless mic system', isEquipment: true },
    { barcode: 'WMIC-002', productName: 'WMIC60 Wireless Microphone', productType: 'Wireless Device', status: 'Available', location: 'Audio Room', notes: 'Wireless handheld mic', isEquipment: true },
    { barcode: 'REC-001', productName: 'Zoom H8 Handy Recorder', productType: 'Recorder', status: 'Available', location: 'Audio Room', notes: '8-track recorder', isEquipment: true },
    { barcode: 'REC-002', productName: 'Zoom H6 Handy Recorder', productType: 'Recorder', status: 'Available', location: 'Audio Room', notes: '6-track recorder', isEquipment: true },
    { barcode: 'MIX-001', productName: 'Mixing Console (4 Channel)', productType: 'Mixer', status: 'Available', location: 'Audio Room', notes: 'Audio mixer', isEquipment: true },
    { barcode: 'BOOM-001', productName: 'RODE Boom Arm', productType: 'Boom Arm', status: 'Available', location: 'Audio Room', notes: 'Studio boom arm', isEquipment: true },
    { barcode: 'TXRX-001', productName: 'RODE Link Transmitter RX-CAM / TX-BELT', productType: 'Transmitter', status: 'Available', location: 'Audio Room', notes: 'Wireless transmitter/receiver', isEquipment: true },
    { barcode: 'TXRX-002', productName: 'MOVO Kit (Transmitter/Receiver)', productType: 'Receiver', status: 'Available', location: 'Audio Room', notes: 'Wireless system', isEquipment: true },

    // 6. Lighting
    { barcode: 'LED-001', productName: 'LED 880 NiceFoto Kit', productType: 'LED Light', status: 'Available', location: 'Lighting Room', notes: 'LED panel kit', isEquipment: true },
    { barcode: 'LED-002', productName: 'LED Photostudio Pro LE500ACC', productType: 'LED Light', status: 'Available', location: 'Lighting Room', notes: 'Professional LED', isEquipment: true },
    { barcode: 'LED-003', productName: 'Godex S600 Kit Combo', productType: 'LED', status: 'Available', location: 'Lighting Room', notes: 'Complete LED kit', isEquipment: true },
    { barcode: 'SOFT-001', productName: 'Godox ADS 65W Soft Box', productType: 'Soft Box', status: 'Available', location: 'Lighting Room', notes: 'Small softbox', isEquipment: true },
    { barcode: 'SOFT-002', productName: 'Froza Softbox SB-FMM-60', productType: 'Soft Box', status: 'Available', location: 'Lighting Room', notes: 'Medium softbox', isEquipment: true },
    { barcode: 'SOFT-003', productName: 'Godex Soft Box P120L', productType: 'Soft Box', status: 'Available', location: 'Lighting Room', notes: 'Large parabolic softbox', isEquipment: true },
    { barcode: 'LED-004', productName: 'Godex Light SL 150Pi', productType: 'Light', status: 'Available', location: 'Lighting Room', notes: 'Video LED light', isEquipment: true },
    { barcode: 'RING-001', productName: 'Neewer LED Ring Flash', productType: 'LED Ring', status: 'Available', location: 'Lighting Room', notes: 'Ring light for photography', isEquipment: true },
    { barcode: 'RGB-001', productName: 'Godox Tube Kit 30cm', productType: 'RGB Lights', status: 'Available', location: 'Lighting Room', notes: 'RGB tube light small', isEquipment: true },
    { barcode: 'RGB-002', productName: 'Irmai RGB LED Video Light 60cm', productType: 'RGB Lights', status: 'Available', location: 'Lighting Room', notes: 'RGB tube light large', isEquipment: true },
    { barcode: 'RGB-003', productName: 'Aputure MT Pro', productType: 'RGB Lights', status: 'Available', location: 'Lighting Room', notes: 'RGB mini light', isEquipment: true },
    { barcode: 'LED-005', productName: 'Neewer CN-LUX360', productType: 'LED', status: 'Available', location: 'Lighting Room', notes: 'Dimmable LED panel', isEquipment: true },
    { barcode: 'RGB-004', productName: 'Godox R1 RGB', productType: 'RGB Lights', status: 'Available', location: 'Lighting Room', notes: 'Compact RGB light', isEquipment: true },
    { barcode: 'LED-006', productName: 'Godox LED64', productType: 'LED', status: 'Available', location: 'Lighting Room', notes: 'On-camera LED', isEquipment: true },
    { barcode: 'LED-007', productName: 'Yongnuo YN300 II', productType: 'LED', status: 'Available', location: 'Lighting Room', notes: 'Portable LED panel', isEquipment: true },
    { barcode: 'LED-008', productName: 'LS Photography PPH79', productType: 'LED Light', status: 'Available', location: 'Lighting Room', notes: 'Photography LED', isEquipment: true },
    { barcode: 'LED-009', productName: 'Infrared Vision VL-36L Hak', productType: 'LED Light', status: 'Available', location: 'Lighting Room', notes: 'IR capable LED', isEquipment: true },
    { barcode: 'LED-010', productName: 'Genaray LED-7100T', productType: 'LED Light', status: 'Available', location: 'Lighting Room', notes: 'Bi-color LED', isEquipment: true },
    { barcode: 'LED-011', productName: 'JYLED300S LED Light', productType: 'LED Light', status: 'Available', location: 'Lighting Room', notes: 'Studio LED panel', isEquipment: true },
    { barcode: 'LED-012', productName: 'Neewer CN-160', productType: 'LED', status: 'Available', location: 'Lighting Room', notes: 'Dimmable on-camera LED', isEquipment: true },
    { barcode: 'LED-013', productName: 'Neewer CN-304', productType: 'LED', status: 'Available', location: 'Lighting Room', notes: 'Large LED panel', isEquipment: true },
    { barcode: 'LED-014', productName: 'Speedlight NW-561', productType: 'Light', status: 'Available', location: 'Lighting Room', notes: 'Camera flash speedlight', isEquipment: true },
    { barcode: 'LED-015', productName: 'LED Stands (Economical)', productType: 'Lighting Equipment', status: 'Available', location: 'Stand Storage', notes: 'Budget light stands', isEquipment: true },
    { barcode: 'LED-016', productName: 'Foldio 360 Smart Turntable Light', productType: 'Lighting Equipment', status: 'Available', location: 'Product Photography', notes: 'Product photography turntable', isEquipment: true },

    // 7. Studio Accessories
    { barcode: 'CLAP-001', productName: 'Clapper Board', productType: 'Clapper', status: 'Available', location: 'Production Office', notes: 'Film slate', isEquipment: true },
    { barcode: 'REF-001', productName: 'Reflector Kit (Small)', productType: 'Reflector', status: 'Available', location: 'Lighting Storage', notes: 'Small reflector set', isEquipment: true },
    { barcode: 'REF-002', productName: 'Reflector Kit (Large)', productType: 'Reflector', status: 'Available', location: 'Lighting Storage', notes: 'Large reflector set', isEquipment: true },
    { barcode: 'REF-003', productName: 'Angler Reflector Kit', productType: 'Kit', status: 'Available', location: 'Lighting Storage', notes: 'Professional reflector kit', isEquipment: true },
    { barcode: 'BG-001', productName: 'Background Screen (Green/Black/White)', productType: 'Background Screen', status: 'Available', location: 'Studio B', notes: 'Triple backdrop set', isEquipment: true },
    { barcode: 'BG-002', productName: 'Cowboy Studio Green Screen', productType: 'Background Screen', status: 'Available', location: 'Studio B', notes: 'Chroma key backdrop', isEquipment: true },

    // 8. Bags & Cases
    { barcode: 'BAG-001', productName: 'Equipment Bag Think Tank', productType: 'Bag', status: 'Available', location: 'Storage Room', notes: 'Professional camera bag', isEquipment: true },
    { barcode: 'BAG-002', productName: 'Equipment Bag Tail', productType: 'Bag', status: 'Available', location: 'Storage Room', notes: 'Equipment transport bag', isEquipment: true },
    { barcode: 'BAG-003', productName: 'Back Bag', productType: 'Backpacks', status: 'Available', location: 'Storage Room', notes: 'Camera backpack', isEquipment: true },
    { barcode: 'BAG-004', productName: 'Carry Bag Small', productType: 'Bag', status: 'Available', location: 'Storage Room', notes: 'Small equipment bag', isEquipment: true },
    { barcode: 'BAG-005', productName: 'Medium Bag (Customized)', productType: 'Bags & Cases', status: 'Available', location: 'Storage Room', notes: 'Custom medium case', isEquipment: true },
    { barcode: 'BAG-006', productName: 'Stand Bag', productType: 'Bag', status: 'Available', location: 'Stand Storage', notes: 'Bag for light stands', isEquipment: true },
    { barcode: 'BAG-007', productName: 'Low Eprop Bag (Medium)', productType: 'Bag', status: 'Available', location: 'Storage Room', notes: 'Medium equipment bag', isEquipment: true },

    // 9. Batteries & Power
    { barcode: 'BAT-001', productName: 'V-Mount Battery S-8110S', productType: 'V-Mount Battery', status: 'Available', location: 'Charging Station', notes: 'High capacity V-mount', isEquipment: true },
    { barcode: 'BAT-002', productName: 'V-Mount Battery PB-M98S', productType: 'V-Mount Battery', status: 'Available', location: 'Charging Station', notes: 'Medium capacity V-mount', isEquipment: true },
    { barcode: 'BAT-003', productName: 'V-Mount Ion FB-BP-95W', productType: 'V-Mount Battery', status: 'Available', location: 'Charging Station', notes: 'Lithium ion V-mount', isEquipment: true },
    { barcode: 'BAT-004', productName: 'ZEGO BZ-95 Mini', productType: 'Battery', status: 'Available', location: 'Battery Cabinet', notes: 'Compact battery', isEquipment: true },
    { barcode: 'BAT-005', productName: 'Canon Camera Battery', productType: 'Battery', status: 'Available', location: 'Battery Cabinet', notes: 'Canon LP-E6 compatible', isEquipment: true },
    { barcode: 'BAT-006', productName: 'Lumix Battery GH4', productType: 'Battery', status: 'Available', location: 'Battery Cabinet', notes: 'Panasonic DMW-BLF19', isEquipment: true },
    { barcode: 'BAT-007', productName: 'Monitor and Light Battery', productType: 'Battery', status: 'Available', location: 'Battery Cabinet', notes: 'NP-F style battery', isEquipment: true },
    { barcode: 'BAT-008', productName: 'Energizer Cell AAA', productType: 'Battery', status: 'Available', location: 'Battery Cabinet', notes: 'AAA batteries pack', isEquipment: true },
    { barcode: 'CHG-001', productName: 'V-Mount Charger', productType: 'Charger', status: 'Available', location: 'Charging Station', notes: 'Dual bay V-mount charger', isEquipment: true },
    { barcode: 'CHG-002', productName: 'Energizer Cell Charger', productType: 'Charger', status: 'Available', location: 'Charging Station', notes: 'AA/AAA battery charger', isEquipment: true },
    { barcode: 'INV-001', productName: 'Godox LP750X Inverter', productType: 'Inverter', status: 'Available', location: 'Power Room', notes: 'Power inverter', isEquipment: true },
    { barcode: 'PWR-001', productName: 'Power Bank Anker PowerCore+', productType: 'Power Bank', status: 'Available', location: 'Equipment Drawer', notes: 'USB power bank', isEquipment: true },
    { barcode: 'TEST-001', productName: 'Battery Power Tester DLYFULLB2', productType: 'Battery Power Tester', status: 'Available', location: 'Charging Station', notes: 'Battery capacity tester', isEquipment: true },
    { barcode: 'EXT-001', productName: 'Extension Cords', productType: 'Power & Accessories', status: 'Available', location: 'Power Room', notes: 'Power extension set', isEquipment: true },
    { barcode: 'EXT-002', productName: 'Extension Roll', productType: 'Power & Accessories', status: 'Available', location: 'Power Room', notes: 'Long extension reel', isEquipment: true },

    // 10. Cables & Adapters
    { barcode: 'CBL-001', productName: 'HDMI Cable 15ft', productType: 'Cable', status: 'Available', location: 'Cable Drawer', notes: 'High speed HDMI cable', isEquipment: true },
    { barcode: 'CBL-002', productName: 'Audio Scale XLR AUX 3.5 Extension', productType: 'Cable', status: 'Available', location: 'Audio Cables', notes: 'XLR to 3.5mm cable', isEquipment: true },
    { barcode: 'CBL-003', productName: 'Blackmagic Video Assist Cable', productType: 'Cable', status: 'Available', location: 'Cable Drawer', notes: 'Video cable set', isEquipment: true },
    { barcode: 'EXT-003', productName: 'Small Extension Socket', productType: 'Socket', status: 'Available', location: 'Power Room', notes: 'Power strip small', isEquipment: true },
    { barcode: 'EXT-004', productName: 'Power Extension Cord', productType: 'Extension', status: 'Available', location: 'Power Room', notes: 'Standard extension cord', isEquipment: true },
    { barcode: 'EXT-005', productName: 'Extension Roll (Large)', productType: 'Extension', status: 'Available', location: 'Power Room', notes: 'Heavy duty extension reel', isEquipment: true },

    // 11. Monitors & Displays
    { barcode: 'MON-001', productName: 'Koolertron Small Monitor', productType: 'Monitor', status: 'Available', location: 'Equipment Room', notes: 'Portable field monitor', isEquipment: true },
    { barcode: 'MON-002', productName: 'iPad Pro 11"', productType: 'Screen', status: 'Available', location: 'Office', notes: 'Tablet for monitoring', isEquipment: true },
    { barcode: 'DISP-001', productName: 'iMac 27" (2019)', productType: 'Computing & Display', status: 'Available', location: 'Editing Suite', notes: 'Desktop workstation', isEquipment: true },
    { barcode: 'DISP-002', productName: 'Samsung LED Monitor U28', productType: 'Computing & Display', status: 'Available', location: 'Editing Suite', notes: '4K monitor', isEquipment: true },

    // 12. Storage Devices
    { barcode: 'STO-001', productName: 'WD My Passport Ultra', productType: 'Storage Devices', status: 'Available', location: 'IT Room', notes: 'Portable HDD 2TB', isEquipment: true },
    { barcode: 'STO-002', productName: 'WD Elements 3221B', productType: 'Storage Devices', status: 'Available', location: 'IT Room', notes: 'Desktop HDD 3TB', isEquipment: true },
    { barcode: 'STO-003', productName: 'WD My Passport Wireless', productType: 'Storage Devices', status: 'Available', location: 'IT Room', notes: 'Wireless portable HDD', isEquipment: true },

    // 13. Softwares
    { barcode: 'SOFT-101', productName: 'Adobe Premiere Pro License', productType: 'Editing Software', status: 'Available', location: 'Digital Assets', notes: 'Video editing software', isEquipment: false },
    { barcode: 'SOFT-102', productName: 'Final Cut Pro License', productType: 'Editing Software', status: 'Available', location: 'Digital Assets', notes: 'Apple video editing', isEquipment: false },
    { barcode: 'SOFT-103', productName: 'Adobe Photoshop License', productType: 'Design Software', status: 'Available', location: 'Digital Assets', notes: 'Photo editing software', isEquipment: false },
    { barcode: 'SOFT-104', productName: 'Adobe Illustrator License', productType: 'Design Software', status: 'Available', location: 'Digital Assets', notes: 'Vector design software', isEquipment: false },
    { barcode: 'SOFT-105', productName: 'Microsoft Office 365', productType: 'Office Software', status: 'Available', location: 'Digital Assets', notes: 'Office productivity suite', isEquipment: false },

    // 14. Office Supplies
    { barcode: 'OFF-001', productName: 'Pens and Pencils Set', productType: 'Stationery', status: 'Available', location: 'Office Supply Cabinet', notes: 'Writing instruments', isEquipment: false },
    { barcode: 'OFF-002', productName: 'Notebooks A4', productType: 'Stationery', status: 'Available', location: 'Office Supply Cabinet', notes: 'Spiral notebooks', isEquipment: false },
    { barcode: 'OFF-003', productName: 'Sticky Notes Assorted', productType: 'Stationery', status: 'Available', location: 'Office Supply Cabinet', notes: 'Post-it notes', isEquipment: false },
    { barcode: 'OFF-004', productName: 'Desk Organizer', productType: 'Desk Items', status: 'Available', location: 'Office', notes: 'Desktop organization', isEquipment: false },
    { barcode: 'OFF-005', productName: 'Paper Clips & Binders', productType: 'Desk Items', status: 'Available', location: 'Office Supply Cabinet', notes: 'Office fasteners', isEquipment: false },
    { barcode: 'OFF-006', productName: 'Printer Paper A4 Ream', productType: 'Printer Supplies', status: 'Available', location: 'Print Room', notes: 'Copy paper 500 sheets', isEquipment: false },
    { barcode: 'OFF-007', productName: 'Ink Cartridges Set', productType: 'Printer Supplies', status: 'Available', location: 'Print Room', notes: 'Printer ink refills', isEquipment: false },

    // 15. Pantry
    { barcode: 'PAN-001', productName: 'Coffee & Tea Supplies', productType: 'Snacks', status: 'Available', location: 'Pantry', notes: 'Hot beverages', isEquipment: false },
    { barcode: 'PAN-002', productName: 'Snack Box Assorted', productType: 'Snacks', status: 'Available', location: 'Pantry', notes: 'Mixed snacks', isEquipment: false },
    { barcode: 'PAN-003', productName: 'Disposable Cups Pack', productType: 'Disposable Items', status: 'Available', location: 'Pantry', notes: 'Paper cups 100 count', isEquipment: false },
    { barcode: 'PAN-004', productName: 'Disposable Plates & Utensils', productType: 'Disposable Items', status: 'Available', location: 'Pantry', notes: 'Disposable dinnerware', isEquipment: false },

    // 16. Transportation
    { barcode: 'TRANS-001', productName: 'Company Van', productType: 'Vehicles', status: 'Available', location: 'Parking Lot', notes: 'Equipment transport van', isEquipment: false },
    { barcode: 'TRANS-002', productName: 'Delivery Dolly', productType: 'Delivery Equipment', status: 'Available', location: 'Loading Dock', notes: 'Hand truck for transport', isEquipment: false },
    { barcode: 'TRANS-003', productName: 'Equipment Cart', productType: 'Delivery Equipment', status: 'Available', location: 'Storage', notes: 'Rolling equipment cart', isEquipment: false },
    { barcode: 'TRANS-004', productName: 'Travel Case Set', productType: 'Travel Accessories', status: 'Available', location: 'Storage Room', notes: 'Protective travel cases', isEquipment: false },

    // 17. Furniture
    { barcode: 'FURN-001', productName: 'Office Chair Ergonomic', productType: 'Chairs', status: 'Available', location: 'Office', notes: 'Adjustable office chair', isEquipment: false },
    { barcode: 'FURN-002', productName: 'Director Chair Set', productType: 'Chairs', status: 'Available', location: 'Studio', notes: 'Folding director chairs', isEquipment: false },
    { barcode: 'FURN-003', productName: 'Conference Table', productType: 'Tables', status: 'Available', location: 'Meeting Room', notes: 'Large meeting table', isEquipment: false },
    { barcode: 'FURN-004', productName: 'Production Desk', productType: 'Tables', status: 'Available', location: 'Studio', notes: 'Work desk', isEquipment: false },
    { barcode: 'FURN-005', productName: 'Storage Cabinet Metal', productType: 'Storage Units', status: 'Available', location: 'Equipment Room', notes: 'Lockable storage cabinet', isEquipment: false },
    { barcode: 'FURN-006', productName: 'Shelving Unit', productType: 'Storage Units', status: 'Available', location: 'Storage Room', notes: '5-tier metal shelving', isEquipment: false },

    // 18. Communication
    { barcode: 'COMM-001', productName: 'Company SIM Card Set', productType: 'SIM Cards', status: 'Available', location: 'IT Office', notes: 'Mobile data SIM cards', isEquipment: false },
    { barcode: 'COMM-002', productName: 'Portable WiFi Hotspot', productType: 'Internet Devices', status: 'Available', location: 'Equipment Room', notes: 'Mobile internet device', isEquipment: false },
    { barcode: 'COMM-003', productName: 'Spare Mobile Phone', productType: 'Mobile Devices', status: 'Available', location: 'IT Office', notes: 'Backup communication device', isEquipment: false },

    // 19. Uniforms & Branding
    { barcode: 'UNI-001', productName: 'Staff Uniform Shirt (S)', productType: 'Uniforms', status: 'Available', location: 'Uniform Storage', notes: 'Small size uniform', isEquipment: false },
    { barcode: 'UNI-002', productName: 'Staff Uniform Shirt (M)', productType: 'Uniforms', status: 'Available', location: 'Uniform Storage', notes: 'Medium size uniform', isEquipment: false },
    { barcode: 'UNI-003', productName: 'Staff Uniform Shirt (L)', productType: 'Uniforms', status: 'Available', location: 'Uniform Storage', notes: 'Large size uniform', isEquipment: false },
    { barcode: 'UNI-004', productName: 'Staff Uniform Shirt (XL)', productType: 'Uniforms', status: 'Available', location: 'Uniform Storage', notes: 'Extra large uniform', isEquipment: false },
    { barcode: 'BRAND-001', productName: 'Name Badges Set', productType: 'Badges', status: 'Available', location: 'HR Office', notes: 'Employee ID badges', isEquipment: false },
    { barcode: 'BRAND-002', productName: 'Luggage Tags', productType: 'Tags', status: 'Available', location: 'Equipment Storage', notes: 'Equipment identification tags', isEquipment: false },
    { barcode: 'BRAND-003', productName: 'Branded T-Shirts (Assorted)', productType: 'T-Shirts', status: 'Available', location: 'Marketing Storage', notes: 'Promotional t-shirts', isEquipment: false },
    { barcode: 'BRAND-004', productName: 'Branded Tote Bags', productType: 'Tote Bags', status: 'Available', location: 'Marketing Storage', notes: 'Company logo tote bags', isEquipment: false },
    { barcode: 'BRAND-005', productName: 'Uniform Storage Bags', productType: 'Uniform Bags', status: 'Available', location: 'Uniform Storage', notes: 'Individual uniform bags', isEquipment: false }
  ];

  for (const item of items) {
    await storage.createItem(item);
    console.log(`  ✓ Created item: ${item.productName}`);
  }

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Total categories: ${equipmentCategories.length + assetCategories.length}`);
  console.log(`📊 Total items: ${items.length}`);
}
