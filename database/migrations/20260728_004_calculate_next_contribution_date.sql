create or replace function public.calculate_next_contribution_date(
  p_current_date date,
  p_frequency text
)
returns date
language plpgsql
immutable
as $function$
begin
  case lower(trim(p_frequency))
    when 'daily' then
      return p_current_date + 1;

    when 'weekly' then
      return p_current_date + 7;

    when 'biweekly' then
      return p_current_date + 14;

    when 'fortnightly' then
      return p_current_date + 14;

    when 'monthly' then
      return (
        p_current_date +
        interval '1 month'
      )::date;

    else
      return p_current_date + 7;
  end case;
end;
$function$;