-- sob.lol · v33 rebrand default accent to sky blue
alter table profiles alter column accent set default '#55acee';

-- Update any existing profiles using the old red fallback accent to the new blue accent
update profiles set accent = '#55acee' where accent = '#e11d2f' or accent = '#e11d2e';
