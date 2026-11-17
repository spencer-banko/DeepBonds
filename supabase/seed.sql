-- Sample institutions matching the pilot story: a department-level package
-- for Georgia Tech's College of Computing and UGA's initial partner
-- college, both upgradeable to university_wide without a data migration.

insert into universities (name, slug, package_tier) values
  ('Georgia Institute of Technology', 'georgia-tech', 'department'),
  ('University of Georgia', 'uga', 'department')
on conflict (slug) do nothing;

insert into colleges (university_id, name, slug)
select id, 'College of Computing', 'college-of-computing' from universities where slug = 'georgia-tech'
union all
select id, 'College of Engineering', 'college-of-engineering' from universities where slug = 'georgia-tech'
union all
select id, 'Scheller College of Business', 'scheller-college-of-business' from universities where slug = 'georgia-tech'
union all
select id, 'Terry College of Business', 'terry-college-of-business' from universities where slug = 'uga'
on conflict (university_id, slug) do nothing;
