-- Function to calculate and update project progress
CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_id uuid;
  _total_items integer;
  _completed_items integer;
  _new_progress integer;
BEGIN
  -- Get the project_id from the affected row
  IF TG_OP = 'DELETE' THEN
    _project_id := OLD.project_id;
  ELSE
    _project_id := NEW.project_id;
  END IF;

  -- Count total and completed deliverables
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO _total_items, _completed_items
  FROM public.project_deliverables
  WHERE project_id = _project_id;

  -- Add tasks to the count
  SELECT 
    _total_items + COUNT(*),
    _completed_items + COUNT(*) FILTER (WHERE status = 'completed')
  INTO _total_items, _completed_items
  FROM public.project_tasks
  WHERE project_id = _project_id;

  -- Calculate progress percentage
  IF _total_items > 0 THEN
    _new_progress := ROUND((_completed_items::numeric / _total_items::numeric) * 100);
  ELSE
    _new_progress := 0;
  END IF;

  -- Update the project progress
  UPDATE public.validation_projects
  SET progress = _new_progress
  WHERE id = _project_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for project_deliverables
DROP TRIGGER IF EXISTS update_progress_on_deliverable_change ON public.project_deliverables;
CREATE TRIGGER update_progress_on_deliverable_change
AFTER INSERT OR UPDATE OF status OR DELETE ON public.project_deliverables
FOR EACH ROW
EXECUTE FUNCTION public.update_project_progress();

-- Create triggers for project_tasks
DROP TRIGGER IF EXISTS update_progress_on_task_change ON public.project_tasks;
CREATE TRIGGER update_progress_on_task_change
AFTER INSERT OR UPDATE OF status OR DELETE ON public.project_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_project_progress();