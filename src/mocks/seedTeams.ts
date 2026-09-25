import { formatRegistrationNumber } from '@/domain/registrationNumber'
import type { AadhaarDocuments, District, MemberNumber, RegistrationStatus, Team, TeamMember } from '@/types/domain'

/**
 * Fictional test data. Names and numbers are invented; no Aadhaar numbers exist anywhere —
 * documents are represented only by opaque upload references.
 */

type SeedMember = [
  name: string,
  mobile: string,
  dob: string,
  district: District,
  role: ['student', string, string] | ['working', string, string],
]

const ADDRESSES: Record<District, string> = {
  'Dakshina Kannada': 'Near Juma Masjid, Deralakatte, Mangaluru 575018',
  Udupi: 'Main Road, Kapu, Udupi 574106',
}

/** Members 1–2 upload card photos, member 3 the e-Aadhaar PDF, so both modes appear in the admin. */
function seedAadhaar(teamId: string, memberNumber: MemberNumber, slug: string): AadhaarDocuments {
  // The mock document service serves a placeholder image for any `seed-` reference.
  const doc = (side: string, fileName: string) => ({
    uploadId: `seed-${teamId}-${memberNumber}-${side}`,
    fileName,
    sizeBytes: 812_000,
    mimeType: 'image/svg+xml',
  })
  return memberNumber === 3
    ? { kind: 'pdf', file: doc('pdf', `e-aadhaar_${slug}.pdf`) }
    : { kind: 'photos', front: doc('front', `aadhaar_front_${slug}.jpg`), back: doc('back', `aadhaar_back_${slug}.jpg`) }
}

function member(teamId: string, memberNumber: MemberNumber, seed: SeedMember): TeamMember {
  const [fullName, mobileNumber, dateOfBirth, district, role] = seed
  const slug = fullName.split(' ')[0]?.toLowerCase() ?? 'member'
  const base = {
    id: `${teamId}-m${memberNumber}`,
    teamId,
    memberNumber,
    fullName,
    mobileNumber,
    dateOfBirth,
    district,
    residentialAddress: ADDRESSES[district],
    studyingInMadrasa: false,
    isAalim: false,
    aadhaar: seedAadhaar(teamId, memberNumber, slug),
  }
  return role[0] === 'student'
    ? { ...base, participantStatus: 'student', courseDetails: role[1], institution: role[2] }
    : { ...base, participantStatus: 'working', occupation: role[1], employer: role[2] }
}

function team(
  sequence: number,
  status: RegistrationStatus,
  createdAt: string,
  members: [SeedMember, SeedMember, SeedMember],
  adminNote?: string,
): Team {
  const id = `team-${sequence}`
  return {
    id,
    registrationNumber: formatRegistrationNumber(sequence),
    status,
    createdAt,
    adminNote,
    members: members.map((m, i) => member(id, (i + 1) as MemberNumber, m)),
  }
}

export function createSeedTeams(): Team[] {
  return [
    team(1, 'verified', '2026-09-10T09:12:00+05:30', [
      ['Nihal Ahmed', '9448211094', '2003-04-12', 'Dakshina Kannada', ['student', 'B.E. Mechanical (3rd year)', 'St. Joseph Engineering College']],
      ['Sahil Rahman', '9482011387', '2004-01-30', 'Dakshina Kannada', ['student', 'B.Com (2nd year)', 'St. Aloysius College']],
      ['Imran Basha', '9900112045', '2001-07-19', 'Dakshina Kannada', ['working', 'Accountant', 'Coastal Traders']],
    ]),
    team(2, 'verified', '2026-09-10T11:40:00+05:30', [
      ['Abdul Raziq', '9740154320', '2002-10-02', 'Dakshina Kannada', ['student', 'M.Sc Chemistry', 'Mangalore University']],
      ['Fahad Hussain', '9611023984', '2003-12-21', 'Dakshina Kannada', ['student', 'BBA (Final year)', 'Yenepoya University']],
      ['Mushtaq Ali', '9845670032', '2000-05-08', 'Udupi', ['working', 'Pharmacist', 'Care Pharma, Udupi']],
    ]),
    team(3, 'rejected', '2026-09-11T15:05:00+05:30', [
      ['Shahid Kunhi', '9008123476', '1998-02-14', 'Dakshina Kannada', ['working', 'Sales Executive', 'Bharath Motors']],
      ['Anas Moideen', '9535098712', '2002-08-25', 'Dakshina Kannada', ['student', 'B.A. (2nd year)', 'Govt. First Grade College']],
      ['Riyaz Umar', '9731456602', '2003-03-03', 'Udupi', ['student', 'Diploma in Civil Engg.', 'Karavali Polytechnic']],
    ], 'Member 1 is above the age limit (born 1998).'),
    team(4, 'verified', '2026-09-12T10:22:00+05:30', [
      ['Irfan Sheikh', '9886045128', '2002-06-17', 'Dakshina Kannada', ['student', 'MBBS (3rd year)', 'Yenepoya Medical College']],
      ['Tahir Beary', '9964300871', '2001-09-09', 'Dakshina Kannada', ['working', 'Software Engineer', 'CloudTek Solutions']],
      ['Junaid Khan', '9591223340', '2004-02-11', 'Dakshina Kannada', ['student', 'B.Sc Physics', 'University College Mangaluru']],
    ]),
    team(5, 'submitted', '2026-09-14T18:47:00+05:30', [
      ['Tariq Mansoor', '9901233418', '2002-11-28', 'Udupi', ['student', 'B.Tech CSE (Final year)', 'Manipal Institute of Technology']],
      ['Arshad Ibrahim', '9620785541', '2003-05-15', 'Udupi', ['student', 'B.Com (Final year)', 'MGM College, Udupi']],
      ['Zubair Hameed', '9743201196', '2000-12-01', 'Udupi', ['working', 'Electrician', 'Self-employed']],
    ]),
    team(6, 'verified', '2026-09-16T08:15:00+05:30', [
      ['Sameer Abbas', '9448900217', '2001-01-23', 'Dakshina Kannada', ['working', 'Teacher', 'Crescent School, Ullal']],
      ['Nabeel Yusuf', '9611780034', '2004-07-07', 'Dakshina Kannada', ['student', 'BCA (2nd year)', 'Srinivas University']],
      ['Rizwan Hakeem', '9880145671', '2002-03-19', 'Dakshina Kannada', ['student', 'LLB (3rd year)', 'SDM Law College']],
    ]),
    team(7, 'submitted', '2026-09-20T13:32:00+05:30', [
      ['Mohammed Farhan', '9845128940', '2001-08-14', 'Dakshina Kannada', ['student', 'B.E. Computer Science (Final year)', 'P.A. College of Engineering']],
      ['Zaid Ahmed', '9876391024', '2003-01-03', 'Dakshina Kannada', ['student', 'B.Com (Final year)', 'St. Aloysius College']],
      ['Bilal Hussain', '9481203948', '2000-11-19', 'Udupi', ['working', 'Software Engineer', 'CloudTek Solutions']],
    ]),
    team(8, 'submitted', '2026-09-22T20:05:00+05:30', [
      ['Adil Shareef', '9632014587', '2003-09-30', 'Udupi', ['student', 'B.Sc Nursing', 'Father Muller College']],
      ['Rayyan Kasim', '9008771203', '2004-04-22', 'Udupi', ['student', 'B.Com (1st year)', 'Poornaprajna College']],
      ['Hisham Latheef', '9535412098', '2001-10-10', 'Udupi', ['working', 'Graphic Designer', 'Pixel Studio']],
    ]),
  ]
}
