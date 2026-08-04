-- Video-call feature: each user can save their own personal Zoom
-- meeting link on their profile; other members can then use it to
-- start a call with them directly from a DM. No Zoom API/OAuth
-- involved — just a saved link, opened in a new tab on click.
alter table profiles add column if not exists zoom_link text;
